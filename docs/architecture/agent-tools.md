# Agent Tools (planned)

The agent will have access to these tools via LangGraph tool nodes, calling the [`process-improve`](https://github.com/kgdunn/process-improve) package.

## 1. create_design

Generate an experimental design matrix.

- **Input**: factors (names, levels, types), design type (full factorial, fractional, CCD, BBD, optimal, mixture, screening), optional constraints
- **Output**: design matrix (runs x factors), design properties (resolution, aliasing)

## 2. analyze_results

Fit a model to experimental results.

- **Input**: design matrix, response values (partial OK), model type (linear, interaction, quadratic)
- **Output**: coefficients, p-values, R², adjusted R², ANOVA table, residuals

## 3. create_visualization

Generate interactive chart data for ECharts.

- **Input**: visualization type (response_surface, contour, main_effects, interaction, pareto, normal_probability, residual), model reference, axis factors
- **Output**: ECharts option object (ready for frontend rendering)

## 4. suggest_next_runs

Recommend additional experimental runs.

- **Input**: current design + results, objective (reduce variance, explore region, validate model)
- **Output**: recommended runs with rationale

## 5. validate_design

Check a proposed design for issues.

- **Input**: design matrix, factors
- **Output**: warnings (confounding, low power, missing interactions), suggestions

## 6. compare_designs

Compare multiple design alternatives.

- **Input**: list of designs
- **Output**: comparison table (runs, resolution, D-efficiency, power)

## 7. run_pca / run_pls

Multivariate analysis tools.

- **Input**: data matrix, number of components
- **Output**: scores, loadings, explained variance, diagnostics

## 8. control_chart

Statistical process control.

- **Input**: process data, chart type (Shewhart, CUSUM, EWMA)
- **Output**: chart data with control limits, out-of-control signals
