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
import {ICheckerArguments} from '../src/commit-message-checker'

// Shared mutable input state, referenced by the hoisted @actions/core mock.
const state = vi.hoisted(() => ({inputs: {} as Record<string, string>}))

// Mock @actions/core
vi.mock('@actions/core', () => ({
  getInput: (name: string, options?: InputOptions) => {
    const val = state.inputs[name] || ''
    if (options && options.required && !val) {
      throw new Error(`Input required and not supplied: ${name}`)
    }
    return val.trim()
  }
}))

import * as inputHelper from '../src/input-helper'

describe('input-helper tests', () => {
  beforeEach(() => {
    // Reset inputs
    state.inputs = {}
  })

  it('requires pattern', () => {
    expect(() => {
      const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    }).toThrow('Input required and not supplied: pattern')
  })

  it('requires error message', () => {
    state.inputs.pattern = 'some-pattern'
    expect(() => {
      const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    }).toThrow('Input required and not supplied: error')
  })

  it('sets flags', () => {
    state.inputs.pattern = 'some-pattern'
    state.inputs.flags = 'abcdefgh'
    state.inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    expect(checkerArguments.flags).toBe('abcdefgh')
  })

  it('sets correct pattern and error payload', () => {
    state.inputs.pattern = 'some-pattern'
    state.inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
  })

  it('requires pattern', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '',
      flags: '',
      error: ''
    }

    expect(() => {
      inputHelper.checkArgs(checkerArguments)
    }).toThrow('PATTERN not defined.')
  })

  it('requires valid flags', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: 'abcdefgh',
      error: ''
    }
    expect(() => {
      inputHelper.checkArgs(checkerArguments)
    }).toThrow('FLAGS contains invalid characters "abcdefh".')
  })

  it('requires valid error message', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: 'g',
      error: ''
    }
    expect(() => {
      inputHelper.checkArgs(checkerArguments)
    }).toThrow('ERROR not defined.')
  })

  it('should throw error message on genOutput', async () => {
    expect(() => {
      inputHelper.genOutput()
    }).toThrow("Cannot read properties of undefined (reading 'map')")
  })

  it('should return error message on genOutput', async () => {
    const attributes = {
      commitInfos: [
        {
          sha: 'aaaaaaa1111',
          message: 'message1'
        },
        {
          sha: 'bbbbbbb2222',
          message: 'message2'
        }
      ],
      preErrorMsg: 'i am a preErrorMessage',
      postErrorMSG: 'i am a posterrormessage'
    }
    const expected: any = inputHelper.genOutput(
      attributes.commitInfos,
      attributes.preErrorMsg,
      attributes.postErrorMSG
    )

    expect(expected).toMatchInlineSnapshot(`
      "i am a preErrorMessage

        aaaaaaa1111    message1
        bbbbbbb2222    message2

      i am a posterrormessage"
    `)
  })
})
