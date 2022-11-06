# Speech Refine


## 1. Devevelopment env


## 2. How to deploy

Optional - Bootstrap your region if you use cdk for the first time

```
cdk bootstrap
```

a. Deploy and setup your secret first

```
cdk deploy SecretStack
```

```
aws secretsmanager put-secret-value --secret-id secret_arn --secret-string your_github_token
```
b. Deploy the main application

