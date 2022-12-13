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

import * as core from '@actions/core'
import * as github from '@actions/github'
import * as inputHelper from './input-helper'
import * as commitMessageChecker from './commit-message-checker'

const validEvent = ['pull_request']

async function run(): Promise<void> {
  try {
    const {
      eventName,
      payload: {repository: repo, pull_request: pr}
    } = github.context

    if (!validEvent.includes(eventName)) {
      core.error(`Invalid event: ${eventName}`)
      return
    }
    if (!repo) {
      core.error(`Invalid repo: ${repo}`)
      return
    }
    if (!pr) {
      core.error(`Invalid pr: ${pr}`)
      return
    }

    const token = core.getInput('token')
    const filterOutPattern = core.getInput('filter_out_pattern')
    const filterOutFlags = core.getInput('filter_out_flags')
    const octokit = github.getOctokit(token)

    const commitsListed = await octokit.rest.pulls.listCommits({
      owner: repo.owner.login,
      repo: repo.name,
      pull_number: pr.number
    })

    let commits = commitsListed.data

    if (filterOutPattern) {
      const regex = new RegExp(filterOutPattern, filterOutFlags)
      commits = commits.filter(({commit}) => {
        return !regex.test(commit.message)
      })
    }

    // core.setOutput('commits', JSON.stringify(commits))

    const onePassAllPass = core.getInput('one_pass_all_pass')
    // const commitsString = core.getInput('commits')
    // const commits = JSON.parse(commitsString)
    const checkerArguments = inputHelper.getInputs()
    inputHelper.checkArgs(checkerArguments)

    const preErrorMsg = core.getInput('pre_error')
    const postErrorMsg = core.getInput('post_error')

    const failed = []

    for (const {commit, sha} of commits) {
      const errMsg = commitMessageChecker.checkCommitMessages(
        checkerArguments,
        commit.message
      )
      if (errMsg) {
        failed.push({sha, message: errMsg})
      }
    }

    if (onePassAllPass === 'true' && commits.length > failed.length) {
      return
    }

    const errMsg = commitMessageChecker.checkCommitMessages(
      checkerArguments,
      pr.title
    )
    if (errMsg) {
      failed.push({sha: 'pull request title', message: errMsg})
    }

    if (failed.length > 0) {
      const summary = inputHelper.genOutput(failed, preErrorMsg, postErrorMsg)
      core.setFailed(summary)
    }
  } catch (error) {
    core.error(error as string | Error)
    core.setFailed((error as Error).message)
  }
}

run()
