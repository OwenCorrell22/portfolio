#!/usr/bin/env python3
"""Regenerate photography.html gallery and collection stacks from collections.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def load_attrs(i: int) -> str:
    if i <= 3:
        return ' loading="eager" fetchpriority="high"'
    if i <= 9:
        return ' loading="eager"'
    return ' loading="lazy"'


def build_gallery(collections: list, excluded: set[int]) -> str:
    member_set: set[int] = set()
    for col in collections:
        member_set.update(col["photos"])
    member_set.update(excluded)

    singles = [n for n in range(1, 67) if n not in member_set]
    gallery_class = "photo-gallery photo-gallery--collections" if not singles else "photo-gallery"

    lines = []
    for idx, col in enumerate(collections, 1):
        slug = col["slug"]
        title = col.get("title", slug)
        cover = col["cover"]
        desc = col.get("description", "").strip()
        desc_html = (
            f'\n        <span class="photo-collection-desc">{desc}</span>'
            if desc
            else ""
        )
        lines.append(
            f'      <a href="{slug}.html" class="photo-collection-entry">\n'
            f'        <span class="photo-collection-title">{title}</span>{desc_html}\n'
            f'        <span class="photo-collection-card">\n'
            f'          <img src="assets/thumbs/{cover}.jpg" alt="{title} collection"{load_attrs(idx)} '
            f'decoding="async" class="visible">\n'
            f"        </span>\n"
            f"      </a>"
        )

    visible_i = len(collections)
    for n in singles:
        visible_i += 1
        lines.append(
            f'      <div class="photo-cell">\n'
            f'        <span class="photo-index">{n}</span>\n'
            f'        <img src="assets/thumbs/{n}.jpg" alt="Photograph {n} by Owen Correll"{load_attrs(visible_i)} '
            f'decoding="async" data-full="assets/view/{n}.jpg" data-thumb="assets/thumbs/{n}.jpg">\n'
            f"      </div>"
        )

    return f"    <div class=\"{gallery_class}\">\n" + "\n".join(lines) + "\n    </div>"


def update_collection_header(path: Path, title: str, description: str) -> None:
    desc_block = (
        f'\n      <p class="collection-desc">{description}</p>' if description.strip() else ""
    )
    header = (
        f'    <header class="collection-header">\n'
        f'      <p class="collection-title">{title}</p>{desc_block}\n'
        f"    </header>"
    )
    text = path.read_text()
    text = re.sub(
        r"    <header class=\"collection-header\">.*?</header>",
        header,
        text,
        count=1,
        flags=re.DOTALL,
    )
    path.write_text(text)


def update_collection_stack(path: Path, photos: list[int]) -> None:
    figures = []
    for i, n in enumerate(photos):
        load = "eager" if i == 0 else "lazy"
        figures.append(
            f'      <figure class="collection-item"><span class="photo-index">{n}</span>'
            f'<img src="assets/view/{n}.jpg" alt="{n}" loading="{load}" decoding="async"></figure>'
        )
    text = path.read_text()
    start = text.index('    <div class="collection-stack">')
    end = text.index("    </div>\n  </main>", start)
    stack = "    <div class=\"collection-stack\">\n" + "\n".join(figures) + "\n    </div>"
    path.write_text(text[:start] + stack + text[end + len("    </div>") :])


def main() -> None:
    data = json.loads((ROOT / "collections.json").read_text())
    collections = data["collections"]
    excluded = set(data.get("excluded", []))

    gallery = build_gallery(collections, excluded)
    photo_html = ROOT / "photography.html"
    html = photo_html.read_text()
    m = re.search(r'    <div class="photo-gallery[^"]*">', html)
    if not m:
        raise SystemExit("photo-gallery block not found in photography.html")
    start = m.start()
    end = html.index("  <footersub>")
    photo_html.write_text(html[:start] + gallery + "\n" + html[end:])

    for col in collections:
        page = ROOT / f'{col["slug"]}.html'
        if page.exists():
            update_collection_header(
                page,
                col.get("title", col["slug"]),
                col.get("description", ""),
            )
            update_collection_stack(page, col["photos"])

    print(f"OK: {len(collections)} collections synced")


if __name__ == "__main__":
    main()
