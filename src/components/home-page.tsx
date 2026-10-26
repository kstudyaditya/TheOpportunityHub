"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { useEffect } from "react";
import type { OpportunityRecord, OpportunityType } from "@/lib/opportunity-types";

type Opportunity = OpportunityRecord & {
  initials: string;
  color: string;
};

const opportunityTypes = [
  "All opportunities",
  "Jobs",
  "Internships",
  "Volunteering",
] as const;

function matchesOpportunityType(type: OpportunityType, filter: string) {
  if (filter === "All opportunities") return true;
  if (filter === "Jobs") return type === "Job";
  if (filter === "Internships") return type === "Internship";
  return type === filter;
}

function presentOpportunity(opportunity: OpportunityRecord): Opportunity {
  const colors: Record<OpportunityType, string> = {
    Job: "sage",
    Internship: "peach",
    Volunteering: "blue",
  };

  return {
    ...opportunity,
    initials: opportunity.organization
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase(),
    color: colors[opportunity.type],
  };
}

function ArrowRight({ small = false }: { small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width={small ? "15" : "18"}
      height={small ? "15" : "18"}
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
      <path
        d="M16.25 8.333c0 4.167-6.25 9.167-6.25 9.167s-6.25-5-6.25-9.167a6.25 6.25 0 1 1 12.5 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.333" r="2.083" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.75 14.4 9.6l6.85 2.4-6.85 2.4L12 21.25 9.6 14.4l-6.85-2.4L9.6 9.6 12 2.75Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activeType, setActiveType] = useState<string>("All opportunities");
  const [search, setSearch] = useState("");
  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [postError, setPostError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadOpportunities() {
      try {
        const response = await fetch("/api/opportunities");
        if (!response.ok) {
          throw new Error("Unable to load opportunities from the database.");
        }
        const records: OpportunityRecord[] = await response.json();
        if (isCurrent) {
          setOpportunities(records.map(presentOpportunity));
          setLoadError("");
        }
      } catch (error) {
        console.error("Unable to load opportunities:", error);
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "Unable to load opportunities.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadOpportunities();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const sectionByPath: Record<string, string> = {
      "/opportunities": "opportunities",
      "/how-it-works": "how-it-works",
      "/community": "community",
      "/membership": "membership",
    };
    const sectionId = sectionByPath[pathname];
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  function openPostForm() {
    setIsPostFormOpen(true);
    setPostMessage("");
    setPostError("");
    if (pathname !== "/opportunities") {
      router.push("/opportunities");
    }
    document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" });
  }

  const filteredOpportunities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return opportunities.filter((opportunity) => {
      const matchesType = matchesOpportunityType(opportunity.type, activeType);
      const matchesSearch =
        !query ||
        `${opportunity.title} ${opportunity.organization} ${opportunity.location} ${opportunity.type}`
          .toLowerCase()
          .includes(query);
      return matchesType && matchesSearch;
    });
  }, [activeType, opportunities, search]);

  async function handlePostOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const type = formData.get("type");
    const title = formData.get("title");
    const organization = formData.get("organization");
    const location = formData.get("location");

    if (
      (type !== "Job" && type !== "Internship" && type !== "Volunteering") ||
      typeof title !== "string" ||
      typeof organization !== "string" ||
      typeof location !== "string"
    ) {
      setPostError("Enter a valid opportunity type, title, organization, and location.");
      return;
    }

    const cleanTitle = title.trim();
    const cleanOrganization = organization.trim();
    const cleanLocation = location.trim();

    if (!cleanTitle || !cleanOrganization || !cleanLocation) {
      setPostError("Title, organization, and location cannot be blank.");
      return;
    }

    setIsSubmitting(true);
    setPostError("");
    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: cleanTitle,
          organization: cleanOrganization,
          location: cleanLocation,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to save this opportunity. Please try again.");
      }
      const created: OpportunityRecord = await response.json();
      setOpportunities((current) => [presentOpportunity(created), ...current]);
      setActiveType("All opportunities");
      setSearch("");
      setIsPostFormOpen(false);
      setPostMessage(`“${cleanTitle}” has been added to the opportunities list.`);
      form.reset();
    } catch (error) {
      console.error("Unable to save opportunity:", error);
      setPostError(error instanceof Error ? error.message : "Unable to save this opportunity.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="utility-bar">
        <div className="site-width utility-content">
          <span>Good things happen when we grow together.</span>
          <Link href="/membership">
            Member resources <ArrowRight small />
          </Link>
        </div>
      </div>

      <header className="site-header">
        <div className="site-width header-content">
          <Link className="brand" href="/" aria-label="Opportunity Hub home">
            <span className="brand-mark"><SparkIcon /></span>
            <span className="brand-name">
              <strong>opportunity</strong>
              <span>HUB <i>•</i> PALATINE</span>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <Link className={pathname === "/" ? "nav-active" : undefined} href="/">Home</Link>
            <Link className={pathname === "/opportunities" ? "nav-active" : undefined} href="/opportunities">Opportunities</Link>
            <Link className={pathname === "/how-it-works" ? "nav-active" : undefined} href="/how-it-works">How it works</Link>
            <Link className={pathname === "/community" ? "nav-active" : undefined} href="/community">Our community</Link>
          </nav>

          <button className="button button-small header-cta" type="button" onClick={openPostForm}>
            Post an opening <ArrowRight small />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="site-width hero-layout">
            <div className="hero-copy">
              <div className="eyebrow"><span /> PALATINE AREA • CONNECTED BY COMMUNITY</div>
              <h1>Find your place.<br />Make your <em>next move.</em></h1>
              <p className="hero-description">
                A more connected community starts with one good opportunity.
                Discover local careers, events, and people ready to help you grow.
              </p>
              <form className="search-box" onSubmit={(event) => event.preventDefault()}>
                <span className="search-icon" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                    <circle cx="8.9" cy="8.9" r="5.9" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m13.3 13.3 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <label className="visually-hidden" htmlFor="opportunity-search">
                  Search local opportunities
                </label>
                <input
                  id="opportunity-search"
                  type="search"
                  placeholder="Try “marketing”, “events”, or “Palatine”"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <Link className="button search-button" href="/opportunities">
                  Explore <ArrowRight small />
                </Link>
              </form>
              <div className="hero-note">
                <span className="note-dots"><i /><i /><i /></span>
                <span>Rooted here. Growing everywhere.</span>
              </div>
            </div>

            <div className="hero-visual" role="img" aria-label="Local business owners collaborating around a table">
              <div className="image-caption">
                <span className="caption-icon"><SparkIcon /></span>
                <span><strong>Made for this community</strong><small>Local connections. Real momentum.</small></span>
              </div>
              <div className="hero-stamp"><span>LOCAL<br />LOOKS<br />GOOD ON<br />YOU.</span><i>✳</i></div>
            </div>
          </div>
          <div className="hero-scribble" aria-hidden="true" />
        </section>

        <section className="community-strip" id="community" aria-label="Community highlights">
          <div className="site-width strip-content">
            <p><span className="strip-icon"><SparkIcon /></span> A little closer to what’s next.</p>
            <div className="strip-stats">
              <span><strong>1,000+</strong> local businesses</span>
              <b />
              <span><strong>One</strong> connected community</span>
              <b />
              <span><strong>Endless</strong> ways to grow</span>
            </div>
          </div>
        </section>

        <section className="opportunities-section section-pad" id="opportunities">
          <div className="site-width">
            <div className="section-heading">
              <div>
                <div className="eyebrow"><span /> YOUR NEXT STEP STARTS HERE</div>
                <h2>Good things are <em>happening.</em></h2>
                <p>Explore what’s opening up around you, and see where it takes you.</p>
              </div>
              <Link
                className="text-link"
                href="/opportunities"
                aria-expanded={isPostFormOpen}
                aria-controls="post-opportunity-form"
                onClick={(event) => {
                  event.preventDefault();
                  if (isPostFormOpen) setIsPostFormOpen(false);
                  else openPostForm();
                }}
              >
                {isPostFormOpen ? "Close form" : "Post an opening"} <ArrowRight small />
              </Link>
            </div>

            {postMessage && (
              <p className="post-success" role="status">{postMessage}</p>
            )}
            {postError && <p className="data-error" role="alert">{postError}</p>}

            {isPostFormOpen && (
              <form
                className="post-opportunity-form"
                id="post-opportunity-form"
                onSubmit={handlePostOpportunity}
              >
                <div className="post-form-heading">
                  <div>
                    <div className="eyebrow"><span /> SHARE AN OPENING</div>
                    <h3>Tell the community what you’re looking for.</h3>
                  </div>
                  <p>Your post will be added to the opportunities list.</p>
                </div>
                <div className="post-form-fields">
                  <label>
                    Opportunity type
                    <select name="type" defaultValue="Job" required>
                      <option value="Job">Job</option>
                      <option value="Internship">Internship</option>
                      <option value="Volunteering">Volunteering</option>
                    </select>
                  </label>
                  <label>
                    Opening title
                    <input name="title" type="text" placeholder="e.g. Marketing Coordinator" required maxLength={90} />
                  </label>
                  <label>
                    Business or organization
                    <input name="organization" type="text" placeholder="Your organization name" required maxLength={70} />
                  </label>
                  <label>
                    Location
                    <input name="location" type="text" placeholder="e.g. Palatine, IL" required maxLength={70} />
                  </label>
                </div>
                <div className="post-form-actions">
                  <p>Posts are saved to the Opportunity Hub database.</p>
                  <button className="button" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Add opportunity"} <ArrowRight small />
                  </button>
                </div>
              </form>
            )}

            <div className="opportunities-toolbar">
              <div className="category-tabs" role="group" aria-label="Filter by opportunity type">
                {opportunityTypes.map((type) => (
                  <button
                    key={type}
                    className={activeType === type ? "category-tab selected" : "category-tab"}
                    type="button"
                    aria-pressed={activeType === type}
                    onClick={() => setActiveType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <span className="results-count">
                {filteredOpportunities.length} {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"}
              </span>
            </div>
            {loadError && <p className="data-error" role="alert">{loadError}</p>}

            {isLoading ? (
              <p className="data-loading" role="status">Loading local opportunities…</p>
            ) : filteredOpportunities.length > 0 ? (
              <div className="opportunity-grid">
                {filteredOpportunities.map((opportunity) => (
                  <article className="opportunity-card" key={opportunity.title}>
                    <div className={`organization-mark ${opportunity.color}`} aria-hidden="true">
                      {opportunity.initials}
                    </div>
                    <div className="card-type">{opportunity.type.toUpperCase()}</div>
                    <h3>{opportunity.title}</h3>
                    <p className="organization-name">{opportunity.organization}</p>
                    <div className="card-footer">
                      <span><PinIcon /> {opportunity.location}</span>
                      <Link href="/membership" aria-label={`Learn more about ${opportunity.title}`}><ArrowRight /></Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span><SparkIcon /></span>
                <h3>Nothing by that name just yet.</h3>
                <p>Try another search or browse all local opportunities.</p>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => { setSearch(""); setActiveType("All opportunities"); }}
                >
                  Clear filters <ArrowRight small />
                </button>
              </div>
            )}

            <div className="section-bottom-link">
              <Link className="button button-outline" href="/membership">See what’s possible <ArrowRight small /></Link>
            </div>
          </div>
        </section>

        <section className="how-section section-pad" id="how-it-works">
          <div className="site-width how-layout">
            <div className="how-intro">
              <div className="eyebrow eyebrow-light"><span /> CONNECTION CHANGES EVERYTHING</div>
              <h2>Local is a great<br />place to <em>begin.</em></h2>
              <p>
                Whether you’re building a business, finding your people, or figuring out what’s next,
                there’s room to make it happen here.
              </p>
              <Link className="button button-light" href="/membership">Get to know us <ArrowRight small /></Link>
            </div>
            <div className="how-steps">
              <article>
                <span className="step-number">01</span>
                <div><h3>Find your people</h3><p>Meet the makers, doers, and neighbors who make this place feel like yours.</p></div>
                <ArrowRight />
              </article>
              <article>
                <span className="step-number">02</span>
                <div><h3>Show up curious</h3><p>From coffee meetups to hands-on workshops, there’s always a reason to connect.</p></div>
                <ArrowRight />
              </article>
              <article>
                <span className="step-number">03</span>
                <div><h3>Grow from here</h3><p>Turn a conversation into a collaboration, and a good idea into what’s next.</p></div>
                <ArrowRight />
              </article>
            </div>
          </div>
        </section>

        <section className="membership-section section-pad" id="membership">
          <div className="site-width membership-card">
            <div className="membership-art" aria-hidden="true">
              <span className="art-circle art-circle-one" />
              <span className="art-circle art-circle-two" />
              <span className="art-spark">✳</span>
              <span className="art-word">together</span>
            </div>
            <div className="membership-copy">
              <div className="eyebrow"><span /> YOUR COMMUNITY IS YOUR ADVANTAGE</div>
              <h2>There’s more room<br />to grow <em>together.</em></h2>
              <p>Meet your neighbors. Find fresh ideas. Make the kind of connections that move your next chapter forward.</p>
              <Link className="button" href="/opportunities">Find your next step <ArrowRight small /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-width footer-main">
          <Link className="brand brand-footer" href="/" aria-label="Opportunity Hub home">
            <span className="brand-mark"><SparkIcon /></span>
            <span className="brand-name">
              <strong>opportunity</strong>
              <span>HUB <i>•</i> PALATINE</span>
            </span>
          </Link>
          <p>A stronger community starts<br />with a connection.</p>
          <div className="footer-links">
            <Link href="/opportunities">Explore opportunities</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/membership">Get involved</Link>
            <Link href="/admin">Admin workspace</Link>
          </div>
          <span className="footer-location"><PinIcon /> Palatine, Illinois</span>
        </div>
        <div className="site-width footer-bottom">
          <span>© 2026 Opportunity Hub. Rooted in Palatine.</span>
          <Link href="/community">Built around community <span>✳</span></Link>
        </div>
      </footer>
    </>
  );
}
