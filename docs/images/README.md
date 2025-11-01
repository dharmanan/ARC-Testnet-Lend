# Images for README and docs

Place UI screenshots or app images here so they can be referenced from `README.md` or docs pages.

Naming & sizing

- Prefer PNG or JPEG files. Name files short and lower-case, e.g. `ui-home.png`, `deposit-flow.png`.
- Keep each image < 1–2 MB if possible to keep repository size small.
- Recommended: width 1200px (max) and a web-optimized quality (PNG-8 or JPEG quality 75).

How to add images locally

```bash
# from repo root
mkdir -p docs/images
# copy images into docs/images (example)
cp ~/Downloads/my-screenshot.png docs/images/ui-home.png
# stage and commit
git add docs/images/ui-home.png README.md
git commit -m "Add screenshots: ui-home.png"
git push origin main
```

How to reference images from markdown

- Use a relative link in markdown. Example inside `README.md` or `docs/`:

```markdown
![Home UI](docs/images/ui-home.png)
```

If you'd like, upload your screenshots here (drag-and-drop or tell me where they are) and I will add them into `docs/images/` and update the README with properly sized previews and captions.
