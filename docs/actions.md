---
layout: page
title: Actions
parent: Using RSSMonster
nav_order: 12
---

# Actions

Actions apply repeatable rules to incoming articles during crawling. For example,
a rule can bookmark release announcements or tag articles mentioning a project.
Open **Settings → Actions**, select **Add Action**, enter a name, choose a type,
and enter a regular expression. For a tag action, also enter the tag value.
Select **Save Changes** to persist the list.

## Available actions

| Type | Result |
| --- | --- |
| Discard article | Store a filtered record hidden from normal queries; skip AI analysis for that entry. This is not physical deletion. |
| Set favorite | Bookmark the article. |
| Mark as read | Set its read state. |
| Mark as clicked | Set its clicked/read-later indicator. |
| Mark as advertisement | Override the advertisement score to `0`; this score measures absence of advertising, so lower means more promotional. |
| Mark as low quality | Override the quality score to `0`. |
| Assign tag | Add the supplied tag. |

## Writing a rule

Use a JavaScript regular expression, either a plain pattern or `/pattern/flags`.
Plain patterns are case-sensitive; `/release|changelog/i` matches either word
without regard to case. For a whole word, use `/\bsecurity\b/i`.

The crawler tests available HTML content, plain text, title, description, and URL
separately. A match in any field is enough. Anchors such as `^` and `$` apply to
an individual field, not to all fields joined together. Invalid expressions are
rejected when saving; a blank expression does not match anything.

Rules run in list order. Several matching actions can apply, but a matching
Discard stops further action evaluation. Score overrides remain effective when
analysis results are applied. Saving rules does not launch a historical
reprocessing job, so do not expect existing stored articles to change immediately.

## Choose the right kind of filter

| Goal | Feature |
| --- | --- |
| Find stored articles by date, state, or score | [Search]({% link search.md %}) |
| Keep a reusable search | [Smart Folders]({% link smart-folders.md %}) |
| Accept only certain future entries from one feed | [Feed item filters]({% link feed-item-filters.md %}) |
| Apply a state, tag, or score rule during crawling | Actions |

Search tokens such as `quality:>0.7` are not action conditions. Actions match
text using regular expressions; use search and Smart Folders for score-based
selection. The API's `POST /api/actions` replaces the complete rule list, so
integrations should load the existing list before editing it.
