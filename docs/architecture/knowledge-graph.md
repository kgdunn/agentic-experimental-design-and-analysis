# Knowledge Graph Schema (planned)

Neo4j knowledge graph for entity relationships and domain ontology.

## Node & Relationship Schema

```
(:User)-[:OWNS]->(:Experiment)-[:HAS_FACTOR]->(:Factor)
(:Experiment)-[:HAS_RESPONSE]->(:Response)
(:Experiment)-[:USED_DESIGN]->(:Design)
(:Experiment)-[:PRODUCED]->(:Model)-[:HAS_VISUALIZATION]->(:Visualization)
(:Model)-[:SHARED_AS]->(:PublicModel)
(:User)-[:HAS_ROLE]->(:Role)
(:Experiment)-[:IN_DOMAIN]->(:Domain)
```
