import * as core from "@actions/core";
import * as github from "@actions/github";
import { handlePullRequest } from "@src/features/pr/handler";
import { handlePushEvent } from "@src/features/push/handler";
import { expectError, failAction } from "@src/shared";

async function run() {
  const token = core.getInput("github-token");
  const { context } = github;
  const { owner, repo } = context.repo;

  if (context.eventName === "pull_request") {
    const pr = context.payload["pull_request"];
    if (!pr) {
      core.error("Pull request payload was not found.");
      core.setFailed("No pull request found in the GitHub context.");
      return;
    }

    const [error] = await expectError(
      handlePullRequest({
        commitSha: pr["head"]["sha"],
        owner,
        prNumber: pr["number"],
        repo,
        token,
      })
    );
    if (error) {
      failAction("Pull request workflow failed", error);
    }
  } else if (context.eventName === "push") {
    const { after, before } = context.payload;

    const [error] = await expectError(
      handlePushEvent({
        after,
        before,
        credentials: {
          confluence: {
            apiToken: core.getInput("confluence-api-token"),
            baseUrl: core.getInput("confluence-base-url"),
            username: core.getInput("confluence-username"),
          },
          gitbook: {
            token: core.getInput("gitbook-token"),
          },
          readme: {
            apiKey: core.getInput("readme-api-key"),
          },
        },
        owner,
        repo,
        token,
      })
    );
    if (error) {
      failAction("Push workflow failed", error);
    }
  } else {
    core.notice(`Unsupported event: '${context.eventName}'.`);
  }
}

run();
