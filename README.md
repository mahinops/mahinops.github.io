# mahinops.github.io

Personal site of Mokhlesur Mahin: an About page, a blog (Go, DSA, DevOps and cloud notes) and the **Go Visual Learning** lessons.

Live at <https://mahinops.github.io>. Built with [Jekyll](https://jekyllrb.com) and the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme, deployed with GitHub Actions.

## What is where

| Path | What it is |
|---|---|
| `_posts/` | Blog posts |
| `_tabs/` | Sidebar pages: About, Go Visual Learning, Archives, Categories, Tags |
| `_data/` | Sidebar contact links, share buttons, and `lessons.yml` (generated, see below) |
| `go-go-go/` | The interactive lessons, copied as static files from the `go-go-go` project |
| `assets/img/` | Site images (profile photo) |
| `assets/css/` | Custom styles on top of the theme |
| `scripts/` | Helper scripts for the lessons |
| `.github/workflows/` | Build and deploy pipeline |

## Run it locally

```shell
bundle install
bundle exec jekyll serve
```

Then open <http://127.0.0.1:4000>.

## Write a post

Add `_posts/YYYY-MM-DD-title.md` with front matter (`title`, `date`, `categories`, `tags`) and push to `main`.

## Update the lessons

The lessons are the `visual/` folder of the `go-go-go` project. To refresh them:

```shell
scripts/sync-lessons.sh /path/to/go-go-go/visual
```

This copies the files into `go-go-go/` and regenerates `_data/lessons.yml`, which feeds the Go Visual Learning page. Commit and push to publish.

## Deploy

Every push to `main` runs `.github/workflows/pages-deploy.yml`: build with Jekyll, check internal links with `html-proofer`, publish to GitHub Pages.

## License

[MIT](LICENSE), from the Chirpy starter.
