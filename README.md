# Speech Refine


## 1. Devevelopment env


## 2. How to deploy

Optional - Bootstrap your region if you use cdk for the first time

```
cdk bootstrap
```

a. Deploy and setup your secret first

```
cdk deploy ${APPNAME}SecretStack
```

Then your_secret_arn will show up in the output log

Set value for secret by

```
aws secretsmanager put-secret-value --secret-id your_secret_arn --secret-string your_github_token
```
b. Deploy the main application



## 3. Useful commands

Checking secret value
```
aws secretsmanager get-secret-value --secret-id your_secret_arn
```

List codebuild projects
```
aws codebuild list-projects
```

Start a build in code build
```
aws codebuild start-build --project-name your_project_name
```
