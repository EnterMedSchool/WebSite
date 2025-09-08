import CuteArticle from "@/components/blog/CuteArticle";

const sample = `
## Introduction

Hypertension, commonly known as high blood pressure, is a significant health concern affecting millions worldwide. In this comprehensive guide, we delve into the nuances of blood pressure management and provide practical insights to empower you on your health journey.

### What we'll cover

- What blood pressure numbers mean
- Simple, actionable lifestyle changes
- When to seek medical attention

> Tip: small, consistent changes have a compounding effect over time!

### A quick checklist

1. Measure your BP at the same time daily
2. Keep a simple log (notes app is enough)
3. Share trends with your healthcare provider

![Inline Demo](https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?cs=srgb&dl=pexels-padrinan-255379.jpg&fm=jpg)

#### Final thoughts

You're not alone — build a routine, track, and improve a little every week.
`;

export default function TestArticlePage() {
  return (
    <div className="space-y-10">
      <CuteArticle
        title="Understanding and Managing Hypertension"
        body={sample}
        coverImage="https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?cs=srgb&dl=pexels-padrinan-255379.jpg&fm=jpg"
        category="Article Detail"
        date={new Date().toISOString()}
        author="Dr. Hannibal Lector"
        stats={{ likes: 251, views: 25000, comments: 11 }}
      />
    </div>
  );
}

