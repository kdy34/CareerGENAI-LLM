# ECR Deploy Guide – CareerGENAI

This document explains how to build and push the backend and frontend Docker images
to AWS ECR from your local machine.

---

## 1. Prerequisites

- AWS account
- AWS CLI installed
- Docker installed and running
- IAM user/role with ECR permissions (ecr:* or at least push/pull)

---

## 2. Configure AWS CLI

```bash
aws configure
# Enter:
#  AWS Access Key ID
#  AWS Secret Access Key
#  Default region (e.g. us-east-1)
#  Default output format (json)
