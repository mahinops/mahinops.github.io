---
title: Go Visual Learning
icon: fas fa-laptop-code
order: 5
permalink: /go-visual-learning/
---

Interactive, step-by-step lessons for **Go** and for **data structures and algorithms in Go**. Every lesson is an animation: press Play, step forward and back, change the input and watch what happens to memory, pointers, goroutines or the algorithm. Each one shows the Go code with the running line highlighted. Nothing to install, it all runs in your browser.

<p class="lesson-actions">
  <a class="btn btn-primary" href="{{ '/go-go-go/' | relative_url }}">All lessons (English)</a>
  <a class="btn btn-outline-primary" href="{{ '/go-go-go/bn/' | relative_url }}">সব লেসন (বাংলা)</a>
</p>

## Go concepts

<div class="lesson-grid">
{% for l in site.data.lessons.go %}
  <a class="lesson-card" href="{{ '/go-go-go/' | append: l.href | relative_url }}">
    <span class="lesson-num">{{ forloop.index }}</span>
    <strong>{{ l.title }}</strong>
    <span class="lesson-desc">{{ l.desc }}</span>
  </a>
{% endfor %}
</div>

## Data structures and algorithms

<div class="lesson-grid">
{% for l in site.data.lessons.dsa %}
  <a class="lesson-card" href="{{ '/go-go-go/' | append: l.href | relative_url }}">
    <span class="lesson-num">{{ forloop.index }}</span>
    <strong>{{ l.title }}</strong>
    <span class="lesson-desc">{{ l.desc }}</span>
  </a>
{% endfor %}
</div>

The lessons come from my [go-go-go](https://github.com/mahinops) study project: a 3-day Go refresher followed by a DSA roadmap, available in English and Bengali.
