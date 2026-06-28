---
id: create-exercises
environment: testbed
domain: learning
capability: exercise-authoring
---

# Teacher creates vocabulary exercises

Given lesson "lesson-a" exists
And the teacher wants beginner vocabulary practice
When the teacher creates 5 vocabulary exercises for the lesson
Then the exercises should be available for review
