# What the AIM artifacts can show

The supplied archive contains **10 tasks × 3 runs**, with **192 organization snapshots** and **675 dispatched branch records**. This is a rich record for demonstrating how the framework makes decisions, beyond presenting only the best score. Run numbers below follow directory-name order. This document describes the original archive. The public replay now includes nine tasks and 27 runs, excludes AES, and offers no raw downloads.

## 1. Explore within the strongest direction

**Data Selection IFEval · run 2 · iteration 3**

Source run: `2026-09-02_03-43-03_autolab.data_select_ifeval_agentic_idea_manager`.

The Surrogate ranks cluster 3, Metadata Stratification & Representations, first, citing its best observed score of 0.377 and lessons favoring metadata and length proxies. Acquisition sends two branches to that same promising cluster, with different idea-level actions:

| Branch | Cluster action | Idea action | Idea rank | Recorded score |
| --- | --- | --- | --- | --- |
| 0 | Exploit | Exploit | 1/6 | 0.119 |
| 1 | Exploit | Explore | 5/6 | 0.377 |

Branch 0 selects Source-Balanced IO-Length Stratification. Branch 1 selects Unsupervised TF-IDF + KMeans Stratification. The latter tests a different mechanism and matches the incumbent, while the more highly ranked refinement regresses. This is a clear example of the two-tier acquisition policy. It illustrates one outcome, not a statistical comparison of exploration and exploitation.

Evidence: `trajectory/i03.b0.03_meta_agent.estimate/cluster_ranks.json`, `idea_ranks_cluster_3/idea_ranks.json` within that estimator directory, `trajectory/i03.b0.04_meta_agent.allocate/allocation.json`, and `overview/score_history.json`.

This is also the qualitative example in §5.3 of the paper. It is the site's default replay.

## 2. An exploratory branch improves on the incumbent

**Data Selection IFEval · run 1 · iteration 3**

Source run: `2026-08-29_23-36-56_autolab.data_select_ifeval_agentic_idea_manager`.

The Surrogate ranks Heuristic Constraint Verification & Density first, following an earlier 0.433 result. Two branches exploit that cluster:

- The idea-level exploitation branch selects Stratified Regex Constraint Verification (rank 1/7), producing 0.082.
- The idea-level exploration branch selects Data Selection via Response Structural Richness (rank 4/7), producing 0.470.

The recorded rationale explicitly shifts attention from prompt-side constraint density to response-side structural complexity. This makes a useful narrative: evidence supports a direction, but exploring a different mechanism inside it can still be valuable.

Evidence: iteration-3 cluster ranks, idea ranks, allocation, and score history in the source archive.

## 3. The auditor repairs attribution

**Data Selection IFEval · run 1 · iteration 1 · branch 0**

The selected proposal is Intra-Source Quality Filtering via Instruction-Following Difficulty (IFD). It calls for model-based difficulty estimates and source quotas. The auditor records that the implementation instead uses regex constraint keywords and source bonuses while retaining curriculum ordering.

The audit sets `idea_mismatch` and reconstructs the idea as **Curriculum Data Selection via Heuristic Constraint Density Scoring**. The score history then associates 0.285 with that reconstructed title and the role `idea_mismatch_relabel`.

This is particularly useful for communicating interpretability: a score alone could incorrectly support the original model-based hypothesis. AIM preserves the distinction between intention and implementation.

Evidence: `trajectory/i01.b0.04_meta_allocate_assign/selected_idea.yaml`, `trajectory/i01.b0.07_pipeline_manager.audit/audit_result.json`, and `overview/score_history.json`.

Across the exported archive, 240 branch audit files contain `idea_mismatch`. This is a count of recorded flags, not an independently verified mismatch rate or a claim that every reconstruction is correct.

## 4. The map changes as research develops

**Flash Attention · run 1**

Source run: `2026-08-04_20-49-54_autolab.flash_attention_agentic_mindmap`.

The first iteration groups 10 ideas into three directions: math optimization, memory/tiling, and SIMD. By iteration 7, the map contains 80 ideas in five directions: SIMD & Instruction-Level Parallelism (25), Fast Math & Exponentiation (25), Cache & Memory Bandwidth (15), Algorithmic Sparsity & Pruning (10), and Low-Precision Quantization (5).

A useful demonstration is to switch from iteration 1 to 2, then to 7. The map is rebuilt semantically; cluster numbers are not permanent identities. These are CPU-oriented implementation themes from this run's logs; the task name should not be used to imply a particular GPU implementation.

Evidence: per-iteration `organization.json` files. Counts describe the pool, not the number of evaluated ideas.

## 5. A planner responds to repeated failures

**Data Selection IFEval · run 3 · after iteration 1**

Source run: `2026-09-03_04-00-49_autolab.data_select_ifeval_agentic_idea_manager`.

All five initial branches record 0.000 and unsuccessful outcomes. The resource planner records a schedule of `[5, 3, 3, 3, 3, 3]`, explaining that multiple smaller rounds allow repeated debugging and refinement. After eight zero-score branches across the first two rounds, iteration 3 finally records positive scores.

The plan is evidence of the agent's explicit budget rationale. It does not establish that the schedule was causally optimal.

Evidence: `overview/allocation_plan_history.jsonl` and `overview/score_history.json`.

## Interpretation limits

- The site displays recorded agent explanations and audit judgments, not private model reasoning or independently established causal explanations.
- One AES run is missing score-history and pool summaries; its outcomes are labeled unavailable rather than inferred.
- Artifact iteration headers sometimes retain the original planned denominator even after adaptive scheduling adds rounds. The explorer uses actual iteration numbers from trajectory folders.
- Paper results and artifact replay have distinct provenance. No experiments were rerun, and no paper aggregate was recalculated from branch logs.
- Optional paper visuals: Figure 2 for the formal pipeline and Figure 4 for time efficiency in the arXiv manuscript. The supplied framework figure and all ten timing figures are now included in the page.
