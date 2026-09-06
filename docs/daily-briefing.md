---
layout: page
title: Daily Briefing
parent: Using RSSMonster
nav_order: 13
---

# Daily Briefing

Daily Briefing brings recent articles together with a short overview of the
stories in your subscriptions. Select **Daily Briefing** in the status navigation
when AI features are enabled. You can read, bookmark, and navigate its articles
with the same controls as other collections.

## Tune your selection

Open **Briefing Preferences** from the briefing context. Defaults include the
last seven days, both read and unread articles, one required source, and no
interest-only or developing-story-only restriction.

- Choose **Last 24 hours** or **Last 7 days**.
- Enable **Only unread articles** to exclude articles you have read. Its optional
  **Mark as read while scrolling** setting is separate from the Unread view's setting.
- Choose **Show only interest-matched articles** or **Show only developing stories**.
  These choices are mutually exclusive.
- Raise the minimum distinct sources from one up to five to require broader
  event coverage. Sources here are separate feeds, not verified independent reporting.
- Enable **Prioritize high-trust coverage** to use Recommended ordering before
  event-strength fallbacks in the story overview.

**Developing events** changes which continuing coverage the story overview uses.
**Show only developing stories** restricts the article collection to qualifying
unread developments. These are different controls.

Save to apply your changes. Cancel discards the draft; **Reset to defaults**
changes the draft and still requires saving.

## Understand the overview

The context reports eligible articles, feeds, newly created events, and connected
topics. The morning overview contains up to four event stories. Excerpts come
from stored article text; missing source text can produce a headline without an
excerpt. It is not a newly generated model summary on every visit.

Reader mode keeps this introduction compact. Narrow portrait screens hide
excerpts. A failure to load the overview does not prevent reading the article list.

The overview and navigation count describe your global briefing, while a selected
category, feed, or tag can narrow the article list. The current **Last 24 hours**
query uses the Today date window, whereas the overview count uses a rolling day;
counts can differ near midnight. A compact category menu can also show zero for
Briefing because category-specific briefing counts are not supplied.

An empty briefing is valid. Try seven days, one source, and disabling interest-only
or developing-only filters. Global score thresholds still apply.

## Receive a briefing by email

In [Settings → Account]({% link account.md %}), verify your address, enable daily briefing
email, and save a delivery time and timezone. SMTP must be enabled by the operator.
The email contains Recommended and Top Stories sections with up to ten articles
each, without repeating an article between sections. It uses saved briefing
eligibility and does not reproduce the four-story on-screen overview exactly.

For technical details, see the [native API]({% link rssmonster-api.md %}),
[scoring guide]({% link scoring.md %}), and [email operations]({% link email-configuration.md %}).
