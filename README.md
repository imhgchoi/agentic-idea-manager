# AIM project page

A self-contained static research website. HTML, CSS, vanilla JavaScript, extracted evidence, and the supplied paper are included. There are no CDN assets, analytics, external fonts, build tools, or runtime dependencies. All paths are relative, so both user and repository GitHub Pages sites work.

## Open on your own computer (no installation required)

1. Extract the entire ZIP first; do not open the page from inside the ZIP preview.
2. Open the extracted `AIM_HOMEPAGE` folder.
3. Double-click `index.html` to open it in a modern browser with JavaScript enabled.

The page, all 27 research runs, figures, and paper work offline. Keep the whole folder together; it can be moved or renamed. You do not need Python, Node.js, a web server, API keys, the original experiment archive, or access to the author's machine. The scripts directory is for optional development and regeneration only.

If you prefer an HTTP preview, open a terminal in the extracted folder and run:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000**. Stop with Ctrl-C. This server is optional.

If this directory is on a remote machine, run the server there and forward its port from your laptop:

```bash
ssh -N -L 8000:127.0.0.1:8000 YOUR_USER@YOUR_SERVER
```

Then open http://localhost:8000 on your laptop. VS Code's Ports panel can also forward port 8000.

## Publish on GitHub Pages

1. Create an **empty public repository** on GitHub. Use `YOUR_USERNAME.github.io` for a user/organization homepage, or a name such as `aim` for a project page. Do not initialize the remote with a README if using the commands below.
2. Run these commands from this directory, replacing the URL with your repository URL:

   ```bash
   cd /nobackup2/froilan/AIM_HOMEPAGE
   git init -b main
   git add .
   git commit -m "Add AIM research project page"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

3. In the repository, open **Settings → Pages → Build and deployment**. Set **Source** to **Deploy from a branch**, select **main** and **/ (root)**, then save.
4. Visit the URL displayed in Pages settings after deployment finishes:
   - User/organization site: `https://YOUR_USERNAME.github.io/`
   - Project site: `https://YOUR_USERNAME.github.io/aim/`

The included `.nojekyll` serves these files without a Jekyll build. No workflow or custom domain is necessary. Nothing has been pushed or deployed by this implementation.

Official instructions: [GitHub Pages quickstart](https://docs.github.com/en/pages/quickstart), [configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Content and customization

- `index.html`: paper title, authors, affiliations, main figure, results, and BibTeX placeholder.
- `styles.css`: responsive layout and color palette.
- `app.js`: research replay, paper results, and ten-task wall-clock figure selector.
- `assets/AIM_paper.pdf`: current arXiv manuscript supplied by the author. The older PDF outside this directory is not the source for this version.
- `assets/mainfig.png`: supplied framework figure.
- `assets/*_combined.pdf`: supplied timing figures, with PNG previews rendered using Ghostscript.
- `data/evidence.js`: minimized display records for nine tasks, 27 runs, and 171 iterations. AES is omitted from the replay, while all ten tasks remain in paper results and timing figures.
- `scripts/extract_artifacts.py`: regenerate the display bundle from the original archive (Python + PyYAML required only for regeneration).

Raw JSON exports, provenance manifests, download buttons, source-directory labels, expansion lessons, and planner panels are removed. The client-side replay necessarily loads its displayed records in the browser; a static GitHub Pages site cannot make that displayed content inaccessible to browser inspection. No raw archive is included.

Citation references follow the current manuscript: Table 1 on page 8, Table 2 on page 9, Figure 4 on page 10, Appendix D.3 starting on page 35. The BibTeX block intentionally reads “to be released soon.”

## Evidence rules

Run numbers follow source-directory ordering. Displayed scores are recorded normalized `score` values, not raw task accuracy or independent re-evaluations. “Eligible best” includes successful results with no audit flags other than `idea_mismatch`. Cluster IDs are local to each iteration. Ranking details use current selected titles where available, otherwise final-pool titles. Agent explanations and audit judgments are displayed as recorded.

Ordinary audit results show only the status label, without explanation logs. Only idea-mismatch reconstructions use a disclosure containing the audit explanation and reconstructed idea. Paper tables are transcribed separately from the arXiv manuscript and are not recomputed from the replay. Timing figures are author-provided plots, not newly rerun experiments.

## Regenerate display records

```bash
python scripts/extract_artifacts.py /path/to/FINAL-OUTPUTS
```

The exporter produces only `data/evidence.js`; it does not create downloadable per-run JSON or manifests.

To regenerate PNG previews without altering the supplied PDF figures:

```bash
for figure in assets/*_combined.pdf; do
  gs -q -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r90 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile="${figure%.pdf}.png" "$figure"
done
```

## Validation

```bash
python scripts/check_site.py
node --check app.js
node scripts/check_render.cjs
```

Checks cover local links, 27 runs and 171 iteration renders, branch-cluster joins, featured-case scores, audit disclosure rules, removed downloads, and all ten timing previews. JavaScript rendering is checked in a DOM stub, not a full browser layout engine. Chromium visual validation previously timed out on this host.
