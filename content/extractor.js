const A2B_EXTRACTOR = {
  getMeta(name) {
    const el =
      document.querySelector(`meta[property="${name}"]`) ||
      document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute('content')?.trim() : null;
  },

  getJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'JobPosting') return item;
          if (item['@graph']) {
            const job = item['@graph'].find((g) => g['@type'] === 'JobPosting');
            if (job) return job;
          }
        }
      } catch {
        /* skip invalid JSON-LD */
      }
    }
    return null;
  },

  extractTitle() {
    const jsonLd = this.getJsonLd();
    if (jsonLd?.title) return jsonLd.title;

    const ogTitle = this.getMeta('og:title');
    if (ogTitle) {
      const cleaned = ogTitle
        .replace(/\s*[|\-–—]\s*.+$/, '')
        .replace(/\s*at\s+.+$/i, '')
        .trim();
      if (cleaned.length > 2) return cleaned;
    }

    const selectors = [
      'h1[data-automation="job-detail-title"]',
      '.jobs-unified-top-card__job-title',
      '.job-details-jobs-unified-top-card__job-title',
      '[data-test="job-title"]',
      '[data-testid="job-title"]',
      '.job-title',
      '.posting-headline h2',
      'h1.posting-headline',
      '.job-header h1',
      '.job__title',
      '.position-title',
      'h1'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text && text.length > 2 && text.length < 200) return text;
    }

    const twitterTitle = this.getMeta('twitter:title');
    if (twitterTitle) return twitterTitle.replace(/\s*[|\-–—]\s*.+$/, '').trim();

    return document.title.replace(/\s*[|\-–—]\s*.+$/, '').trim() || '';
  },

  extractCompany() {
    const jsonLd = this.getJsonLd();
    if (jsonLd?.hiringOrganization?.name) return jsonLd.hiringOrganization.name;

    const selectors = [
      '[data-automation="advertiser-name"]',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__company-name',
      '[data-test="employer-name"]',
      '[data-testid="company-name"]',
      '.company-name',
      '.employer-name',
      '.posting-company',
      '.job__company',
      'a[data-tracking-control-name="public_jobs_topcard-org-name"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text && text.length > 1 && text.length < 100) return text;
    }

    const ogSite = this.getMeta('og:site_name');
    if (ogSite && !/linkedin|indeed|glassdoor|monster|ziprecruiter/i.test(ogSite)) {
      return ogSite;
    }

    const hostname = window.location.hostname.replace(/^www\./, '');
    const jobBoards = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'monster.com', 'ziprecruiter.com', 'greenhouse.io', 'lever.co', 'workday.com', 'ashbyhq.com'];
    const isJobBoard = jobBoards.some((b) => hostname.includes(b));

    if (!isJobBoard) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
    }

    const titleMatch = document.title.match(/at\s+(.+?)(?:\s*[|\-–—]|$)/i);
    if (titleMatch) return titleMatch[1].trim();

    return '';
  },

  extractSalary() {
    const jsonLd = this.getJsonLd();
    if (jsonLd?.baseSalary) {
      const salary = jsonLd.baseSalary;
      if (typeof salary === 'string') return salary;
      if (salary.value) {
        const val = salary.value;
        if (typeof val === 'object') {
          const min = val.minValue || val.value;
          const max = val.maxValue;
          const currency = salary.currency || val.currency || '$';
          if (min && max) return `${currency}${min} – ${currency}${max}`;
          if (min) return `${currency}${min}`;
        }
      }
    }

    const salarySelectors = [
      '[data-automation="salary"]',
      '.salary-snippet',
      '.job-salary',
      '.compensation',
      '[class*="salary"]'
    ];

    for (const sel of salarySelectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text && /\d/.test(text) && text.length < 80) return text;
    }

    const bodyText = document.body?.innerText || '';
    const salaryMatch = bodyText.match(
      /(?:salary|compensation|pay)[:\s]*(\$[\d,]+(?:\s*[-–—]\s*\$[\d,]+)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr))?)/i
    );
    if (salaryMatch) return salaryMatch[1].trim();

    return '';
  },

  extractDescription() {
    const jsonLd = this.getJsonLd();
    if (jsonLd?.description) {
      const tmp = document.createElement('div');
      tmp.innerHTML = jsonLd.description;
      return tmp.textContent?.trim().slice(0, 500) || '';
    }

    const selectors = [
      '[data-automation="jobDescription"]',
      '.jobs-description',
      '.job-description',
      '#job-description',
      '.posting-page .section-wrapper',
      '[class*="description"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text && text.length > 50) return text.slice(0, 500);
    }

    return '';
  },

  extractAll() {
    return {
      title: this.extractTitle(),
      company: this.extractCompany(),
      link: window.location.href,
      salary: this.extractSalary(),
      description: this.extractDescription()
    };
  }
};
