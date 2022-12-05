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
import {ICheckerArguments} from '../src/commit-message-checker'
import {InputOptions} from '@actions/core'

// Late bind
let inputHelper: any

// Mock @actions/core
let inputs = {} as any
const mockCore: any = jest.genMockFromModule('@actions/core')
mockCore.getInput = (name: string, options?: InputOptions) => {
  const val = inputs[name] || ''
  if (options && options.required && !val) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return val.trim()
}

// Mock @actions/github
const mockGitHub: any = jest.genMockFromModule('@actions/github')
mockGitHub.context = {}

describe('input-helper tests', () => {
  beforeAll(() => {
    // Mocks
    jest.setMock('@actions/core', mockCore)
    jest.setMock('@actions/github', mockGitHub)

    // Now import
    inputHelper = require('../src/input-helper')
  })

  beforeEach(() => {
    // Reset inputs and context
    inputs = {}
    mockGitHub.context = {}
  })

  afterAll(() => {
    // Reset modules
    jest.resetModules()
  })

  it('requires pattern', () => {
    expect(() => {
      const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    }).toThrow('Input required and not supplied: pattern')
  })

  it('requires error message', () => {
    inputs.pattern = 'some-pattern'
    expect(() => {
      const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    }).toThrow('Input required and not supplied: error')
  })

  it('sets flags', () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: ''
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.flags = 'abcdefgh'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    expect(checkerArguments.flags).toBe('abcdefgh')
  })

  it('sets correct pull_request title payload', () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: ''
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
  })

  it('sets correct pull_request title and body payload', () => {
    mockGitHub.context = {
      eventName: 'pull_request',
      payload: {
        pull_request: {
          title: 'some-title',
          body: 'some-body'
        }
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
  })

  it('sets correct single push payload', () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            message: 'some-message'
          }
        ]
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
    const checkerArguments: ICheckerArguments = inputHelper.getInputs()
    expect(checkerArguments).toBeTruthy()
    expect(checkerArguments.pattern).toBe('some-pattern')
    expect(checkerArguments.error).toBe('some-error')
  })

  it('sets correct multiple push payload', () => {
    mockGitHub.context = {
      eventName: 'push',
      payload: {
        commits: [
          {
            message: 'some-message'
          },
          {
            message: 'other-message'
          }
        ]
      }
    }
    inputs.pattern = 'some-pattern'
    inputs.error = 'some-error'
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
