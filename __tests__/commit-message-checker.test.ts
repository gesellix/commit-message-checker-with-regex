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

// Late bind
let commitMessageChecker: any

describe('commit-message-checker tests', () => {
  beforeAll(() => {
    // Now import
    commitMessageChecker = require('../src/commit-message-checker')
  })

  it('requires pattern', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '',
      flags: '',
      error: ''
    }
    await expect(
      commitMessageChecker.checkCommitMessages(checkerArguments)
    ).rejects.toThrow('PATTERN not defined.')
  })

  it('requires valid flags', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: 'abcdefgh',
      error: ''
    }
    await expect(
      commitMessageChecker.checkCommitMessages(checkerArguments)
    ).rejects.toThrow("Invalid flags supplied to RegExp constructor 'abcdefgh'")
  })

  it('check fails single message', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: 'some-error'
    }
    expect(
      commitMessageChecker.checkCommitMessages(checkerArguments, 'some-message')
    ).toBe('some-error')
  })

  it('check succeeds on single message', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '.*',
      flags: '',
      error: 'some-error'
    }
    expect(
      commitMessageChecker.checkCommitMessages(checkerArguments, 'some-message')
    ).toBe('')
  })
})
