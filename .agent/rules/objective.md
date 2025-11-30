---
trigger: always_on
---

We're going to finish the assignments, milestones and graduation project of NextLeap's AI bootcamp.

NextLeap is an skilling up platform that does live classes and helps improve skills. Currently I am doing their AI bootcamp. I am learning various ways to build AI based applications and intricacies of it through this bootcamp.



This is the First Milestone task:

RAG-based Mutual Fund FAQ Chatbot



Due by :

Nov 18, 11:59:00 PM (Asia/Calcutta)

Facts-Only MF Assistant is a RAG-based chatbot that answers factual questions about mutual fund schemes using verified sources from AMC, SEBI, and AMFI websites. It provides concise, citation-backed responses while strictly avoiding any investment advice.

Pick ONE product from the following list:



INDMoney

Groww

PowerUp Money

Wealth Monitor

Kuvera.

All Milestones will use the same product you choose here.



Milestone 1

Mutual Fund FAQs (Facts-Only Q&A)

Milestone brief

Build a small FAQ assistant that answers facts about mutual fund schemes—e.g., expense ratio, exit load, minimum SIP, lock-in (ELSS), riskometer, benchmark, and how to download statements—using only official public pages. Every answer must include one source link. No advice.



Who this helps

Retail users comparing schemes; support/content teams answering repetitive MF questions.



What you must build

Scope your corpus: Pick one AMC and 3–5 schemes under it (e.g., one large-cap, one flexi-cap, one ELSS).



Collect 15–25 public pages from AMC/SEBI/AMFI (factsheets, KIM/SID, scheme FAQs, fee/charges pages, riskometer/benchmark notes, statement/tax-doc guides).



FAQ assistant (working prototype):



Answers factual queries only (e.g., “Expense ratio of ?”, “ELSS lock-in?”, “Minimum SIP?”, “Exit load?”, “Riskometer/benchmark?”, “How to download capital-gains statement?”).



Shows one clear citation link in every answer.



Refuses opinionated/portfolio questions (e.g., “Should I buy/sell?”) with a polite, facts-only message and a relevant educational link.



Tiny UI: welcome line + 3 example questions and a note: “Facts-only. No investment advice.”



Key constraints

Public sources only. No screenshots of the app back-end; no third-party blogs as sources.



No PII. Do not accept/store PAN, Aadhaar, account numbers, OTPs, emails, or phone numbers.



No performance claims. Don’t compute/compare returns; link to the official factsheet if asked.



Clarity & transparency. Keep answers ≤3 sentences; add “Last updated from sources: ”.



What to submit (deliverables)

Working prototype link (app/notebook) or a ≤3-min demo video if hosting isn’t possible.



Source list (CSV/MD) of the 15–25 URLs you used.



README with setup steps, scope (AMC + schemes), and known limits.



Sample Q&A file (5–10 queries with the assistant’s answers + links).



Disclaimer snippet used in your UI (facts-only, no advice).



Skills being tested

W1 — Thinking Like a Model: identify the exact fact asked; decide answer vs. refuse.



W2 — LLMs & Prompting: instruction style, concise phrasing, polite safe-refusals, citation wording.



W3 — RAGs (only): small-corpus retrieval with accurate citations from AMC/SEBI/AMFI pages.



Appendix

Abbreviation	Full Form	Description / Context

AMC	Asset Management Company	A financial institution that manages mutual fund schemes and makes investment decisions on behalf of investors.

MF	Mutual Fund	A pool of money collected from investors to invest in securities like stocks, bonds, and other assets.

ELSS	Equity Linked Savings Scheme	A type of mutual fund offering tax benefits under Section 80C of the Income Tax Act, with a mandatory 3-year lock-in period.

SIP	Systematic Investment Plan	An investment method where an investor invests a fixed amount in a mutual fund scheme at regular intervals.

SEBI	Securities and Exchange Board of India	The regulatory authority that oversees securities markets and mutual funds in India.

AMFI	Association of Mutual Funds in India	The industry standards body for mutual funds in India; provides investor education and scheme data.

FAQ	Frequently Asked Questions	A collection of commonly asked questions with factual, concise answers.

Q&A	Question and Answer	The format in which the assistant provides factual responses to user queries.

KIM	Key Information Memorandum	A summary document containing essential details about a mutual fund scheme, such as objectives, risks, and charges.

SID	Scheme Information Document	A detailed document that provides comprehensive information about a specific mutual fund scheme.

RAG	Retrieval-Augmented Generation	A technique that combines information retrieval and generative AI to provide grounded, citation-based responses.

PII	Personally Identifiable Information	Data that can identify an individual (e.g., PAN, Aadhaar, phone number, or email).

PAN	Permanent Account Number	A unique 10-character alphanumeric identifier issued by the Indian Income Tax Department.

OTP	One-Time Password	A short-lived numeric code used for user authentication.

UI	User Interface	The visual part of an application that users interact with.

CSV	Comma-Separated Values	A simple text file format used for storing tabular data, such as a list of URLs.

MD	Markdown	A lightweight markup language used for formatting text documents, like README files.

LLM	Large Language Model	An AI model trained on large text corpora capable of understanding and generating human-like language.

W1 / W2 / W3	Week 1 / Week 2 / Week 3	Represents the weeks in which different learning skills (Thinking like a model, Prompting, RAGs) are being tested.



Okay, this is the second Milestone:

App Review Insights Analyser



Due by :

Dec 2, 11:59:00 PM (Asia/Calcutta)

In this milestone, you’ll build an App Review Insights Analyzer that turns 8–12 weeks of App Store + Play Store reviews into a weekly one-page pulse. Your system should import reviews, group them into up to 5 themes, highlight top insights, user quotes, and action ideas, and finally generate a draft email containing the note. This milestone tests your skills in LLMs, summarization, theme grouping, and workflow automation while staying within public data and avoiding any PII.

Milestone 2

📊 Milestone 2 — App Review Insights Analyzer (Weekly Report Mailer)

🎯 Milestone Brief

Pick the same product you selected in Milestone 1.

Turn recent App Store + Play Store reviews into a one-page weekly pulse containing:

Top themes

Real user quotes

Three action ideas

Finally, send yourself a draft email containing this weekly note.



👥 Who This Helps

Product / Growth Teams → understand what to fix next

Support Teams → know what users are saying & acknowledging

Leadership → quick weekly health pulse

🛠️ What You Must Build

Import reviews from the last 8–12 weeks (rating, title, text, date)

Group reviews into 5 themes max (e.g., onboarding, KYC, payments, statements, withdrawals)

Generate a weekly one-page note:

Top 3 themes

3 user quotes

3 action ideas

Draft an email with the note (send to yourself/alias)

Do NOT include PII

⚠️ Key Constraints

Use public review exports only — no scraping behind logins

Max 5 themes

Keep notes scannable, ≤250 words

No usernames/emails/IDs in any artifacts

📦 Deliverables

Working prototype link or ≤3-min demo video

Latest one-page weekly note (PDF/Doc/MD)

Email draft (screenshot or text)

Reviews CSV used (sample/redacted is fine)

README:

How to re-run for a new week

Theme legend

🧠 Skills Being Tested

W2 — LLMs & Prompting

Summarization

Quote selection

Tone control

W3 — AI Workflow Automations

Import → Group → Generate Note → Draft Email

Share GitHub Link*

Add latest one-page weekly note (PDF/Doc/MD), email draft (screenshot/text), reviews CSV used (sample/redacted is fine) in your README.md

	

Share a working prototype link

Can be a hosting link of notebook or app

	

Share google drive link of demo video (<=3 mins)

Share only if working prototype link is not available and make sure to give view access to everyone

Okay, let's work on the second milestone now.
Last time, I did the entire milestone on n8n, and gave telegram as the frontend, pinecone as the backend.
This time we're going to do it mostly using Cursor. If some backend process(Like scraping data, scheduling etc) is easier to implement in n8n, we'll do that. If not, we'll stick to cursor.


Right now, based on the problem statement of Milestone 2 below, break it down into the steps involved. We'll later decide on how to implement everything.
We plan to get the most relevant reviews of Groww Android app from the web browser  for this exercise.

We're not taking the newest reviews, instead we're taking the reviews marked most helpful. Ideally, we would also like to take into account how many people have marked a particular review as helpful if that's possible to scrape. And then we also want to take the dates. 
We're not sorting it by newest reviews, because most of the reviews when sorted by newest are very low effort and might be fake in a lot of cases. So we don't get much insights from there. The most helpful reviews, as far as I have seen also contains like 90 percent of last few weeks review. So, it takes care of that. 