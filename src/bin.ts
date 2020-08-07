#!/usr/bin/env node
import commander from "commander";
import { CloudFormation, config } from "aws-sdk";
import { format } from "url";
import { stringify } from "querystring";
import { spawnSync } from "child_process";

commander.description(
  "Open the AWS Cloudformation Console for current serverless stack"
);
commander.option(
  "-p --path <path>",
  "Working path for serverless package",
  "."
);
commander.action(async () => {
  process.chdir(commander.path);
  const { output } = spawnSync("serverless", ["info"], { encoding: "utf-8" });
  const region = config.region || "us-east-1";
  const StackName = (
    (
      output
        .filter(Boolean)
        .join("\n")
        .split("\n")
        .find((line) => line.startsWith("stack:")) || ""
    ).split(":")[1] || ""
  ).trim();
  const cf = new CloudFormation({ region });
  const {
    Stacks: [{ StackId } = { StackId: undefined }] = [],
  } = await cf.describeStacks({ StackName }).promise();
  const url = format({
    protocol: "https:",
    host: "console.aws.amazon.com",
    pathname: "/cloudformation/home",
    query: {
      region,
      stackId: StackId,
    },
    hash: "/stacks/stackinfo?" + stringify({ stackId: StackId }),
  });
  spawnSync("open", [url], { stdio: "inherit" });
});

commander.parse(process.argv);
export { commander };
