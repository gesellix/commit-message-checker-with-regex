/*
 * This file is part of the "GS Commit Message Checker" Action for Github.
 *
 * Copyright (C) 2019 by Gilbertsoft LLC (gilbertsoft.org)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * For the full license information, please read the LICENSE file that
 * was distributed with this source code.
 */

/**
 * Imports
 */
import {describe, it, expect, beforeEach, vi} from 'vitest'
import type {InputOptions} from '@actions/core'

// Shared mutable state referenced by the hoisted mocks below.
const state = vi.hoisted(() => ({
  inputs: {} as Record<string, string>,
  context: {} as any,
  commits: [] as {sha: string; commit: {message: string}}[],
  octokitError: null as Error | null
}))

// Mock @actions/core
vi.mock('@actions/core', () => ({
  getInput: (name: string, options?: InputOptions) => {
    const val = state.inputs[name] || ''
    if (options && options.required && !val) {
      throw new Error(`Input required and not supplied: ${name}`)
    }
    return val.trim()
  },
  error: vi.fn(),
  setFailed: vi.fn()
}))

// Mock @actions/github
vi.mock('@actions/github', () => ({
  get context() {
    return state.context
  },
  getOctokit: () => {
    if (state.octokitError) {
      throw state.octokitError
    }
    return {
      rest: {pulls: {listCommits: async () => ({data: state.commits})}}
    }
  }
}))

import * as core from '@actions/core'
import {run} from '../src/main.js'

/**
 * Sets up a valid pull_request context with the required inputs.
 */
function prReady(): void {
  state.context = {
    eventName: 'pull_request',
    payload: {
      repository: {owner: {login: 'owner'}, name: 'repo'},
      pull_request: {number: 1}
    }
  }
  state.inputs.pattern = '.*'
  state.inputs.error = 'some-error'
}

describe('main run tests', () => {
  beforeEach(() => {
    state.inputs = {}
    state.context = {}
    state.commits = []
    state.octokitError = null
  })

  it('errors on invalid event', async () => {
    state.context = {
      eventName: 'push',
      payload: {repository: {}, pull_request: {}}
    }
    await run()
    expect(core.error).toHaveBeenCalledWith('Invalid event: push')
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('errors on missing repo', async () => {
    state.context = {
      eventName: 'pull_request',
      payload: {repository: undefined, pull_request: {number: 1}}
    }
    await run()
    expect(core.error).toHaveBeenCalledWith('Invalid repo: undefined')
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('errors on missing pull request', async () => {
    state.context = {
      eventName: 'pull_request',
      payload: {
        repository: {owner: {login: 'owner'}, name: 'repo'},
        pull_request: undefined
      }
    }
    await run()
    expect(core.error).toHaveBeenCalledWith('Invalid pr: undefined')
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('passes when all commit messages match', async () => {
    prReady()
    state.commits = [{sha: 'aaa', commit: {message: 'anything goes'}}]
    await run()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('fails and reports commits that do not match', async () => {
    prReady()
    state.inputs.pattern = '^\\[TASK\\] '
    state.inputs.error = 'missing type'
    state.inputs.pre_error = 'PRE'
    state.inputs.post_error = 'POST'
    state.commits = [{sha: 'sha1', commit: {message: 'no prefix here'}}]
    await run()
    expect(core.setFailed).toHaveBeenCalledOnce()
    const summary = vi.mocked(core.setFailed).mock.calls[0][0] as string
    expect(summary).toContain('PRE')
    expect(summary).toContain('sha1')
    expect(summary).toContain('missing type')
    expect(summary).toContain('POST')
  })

  it('filters out commits matching filter_out_pattern', async () => {
    prReady()
    state.inputs.pattern = '^keep'
    state.inputs.error = 'bad'
    state.inputs.filter_out_pattern = '^skip'
    state.commits = [
      {sha: 's1', commit: {message: 'skip this one'}},
      {sha: 's2', commit: {message: 'keep this one'}}
    ]
    await run()
    // 'skip this one' is filtered out; 'keep this one' matches the pattern.
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('passes when one_pass_all_pass and at least one commit matches', async () => {
    prReady()
    state.inputs.pattern = '^good'
    state.inputs.error = 'bad'
    state.inputs.one_pass_all_pass = 'true'
    state.commits = [
      {sha: 's1', commit: {message: 'good commit'}},
      {sha: 's2', commit: {message: 'bad commit'}}
    ]
    await run()
    expect(core.setFailed).not.toHaveBeenCalled()
  })

  it('sets failed on unexpected errors', async () => {
    prReady()
    state.octokitError = new Error('boom')
    await run()
    expect(core.setFailed).toHaveBeenCalledWith('boom')
  })
})
