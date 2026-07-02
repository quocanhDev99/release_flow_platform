# Business Flow

## Normal Release Flow

```mermaid
flowchart LR

Developer

-->

FeatureBranch

-->

MergeRequest

-->

MergeToDevel

-->

ReleaseStream

-->

DeploymentWindow

-->

DeploySTG

-->

DeployUAT

-->

DeployProduction
```

---

## Hotfix Flow

```mermaid
flowchart LR

Production

-->

HotfixBranch

-->

ReleaseHotfix

-->

DeployProduction
```

---

## Miss Deployment

```mermaid
flowchart LR

Merged

-->

DecisionEngine

-->

MissWindow

-->

AssignNextWindow
```