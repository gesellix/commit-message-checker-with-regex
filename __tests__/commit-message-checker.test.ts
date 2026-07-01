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
import {describe, it, expect} from 'vitest'
import {
  ICheckerArguments,
  checkCommitMessages
} from '../src/commit-message-checker'

describe('commit-message-checker tests', () => {
  it('check fails single message', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: 'some-pattern',
      flags: '',
      error: 'some-error'
    }
    expect(checkCommitMessages(checkerArguments, 'some-message')).toBe(
      'some-error'
    )
  })

  it('check succeeds on single message', async () => {
    const checkerArguments: ICheckerArguments = {
      pattern: '.*',
      flags: '',
      error: 'some-error'
    }
    expect(checkCommitMessages(checkerArguments, 'some-message')).toBe('')
  })
})
