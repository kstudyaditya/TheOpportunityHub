"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  MemberRecord,
  OpportunityRecord,
  OpportunityStatus,
} from "@/lib/opportunity-types";

type AdminSection = "Overview" | "Opportunities" | "Members";
type Listing = OpportunityRecord;
type Member = MemberRecord;
type ListingStatus = OpportunityStatus;

const navigation: { label: AdminSection; icon: string }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Opportunities", icon: "briefcase" },
  { label: "Members", icon: "users" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="admin-brand-mark" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.75 14.4 9.6l6.85 2.4-6.85 2.4L12 21.25 9.6 14.4l-6.85-2.4L9.6 9.6 12 2.75Z" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function StatusBadge({ status }: { status: ListingStatus }) {
  return <span className={`admin-status admin-status-${status.toLowerCase()}`}>{status}</span>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function memberInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function AdminPanel() {
  const [section, setSection] = useState<AdminSection>("Overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All listings");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [dataError, setDataError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadAdminData() {
      try {
        const response = await fetch("/api/admin/data");
        if (!response.ok) {
          throw new Error("Unable to load admin data from the database.");
        }
        const data: { listings: Listing[]; members: Member[] } = await response.json();
        if (isCurrent) {
          setListings(data.listings);
          setMembers(data.members);
          setDataError("");
        }
      } catch (error) {
        console.error("Unable to load admin data:", error);
        if (isCurrent) {
          setDataError(error instanceof Error ? error.message : "Unable to load admin data.");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadAdminData();
    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesQuery =
        !query ||
        `${listing.title} ${listing.organization} ${listing.type} ${listing.location}`
          .toLowerCase()
          .includes(query);
      return matchesQuery &&
        (statusFilter === "All listings" || listing.status === statusFilter);
    });
  }, [listings, search, statusFilter]);

  async function addListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const organization = String(data.get("organization") ?? "").trim();
    const type = data.get("type");
    if (!title || !organization || (type !== "Job" && type !== "Internship" && type !== "Volunteering")) {
      setDataError("Enter a valid title, organization, and opportunity type.");
      return;
    }

    setDataError("");
    setIsSavingListing(true);
    try {
      const response = await fetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, organization, type }),
      });
      if (!response.ok) {
        throw new Error("Unable to save this opportunity. Please try again.");
      }
      const created: Listing = await response.json();
      setListings((current) => [created, ...current]);
      setShowForm(false);
      setSection("Opportunities");
      setStatusFilter("All listings");
      setSearch("");
      setNotice(`“${title}” was added as a pending listing.`);
    } catch (error) {
      console.error("Unable to add admin opportunity:", error);
      setDataError(error instanceof Error ? error.message : "Unable to save this opportunity.");
    } finally {
      setIsSavingListing(false);
    }
  }

  async function toggleListingStatus(listing: Listing) {
    const status: ListingStatus = listing.status === "Active" ? "Pending" : "Active";
    setBusyListingId(listing.id);
    setDataError("");
    try {
      const response = await fetch(`/api/admin/opportunities/${encodeURIComponent(listing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error("Unable to update this listing. Please try again.");
      }
      setListings((current) =>
        current.map((item) => (item.id === listing.id ? { ...item, status } : item)),
      );
      setNotice("Listing status updated.");
    } catch (error) {
      console.error("Unable to update listing:", error);
      setDataError(error instanceof Error ? error.message : "Unable to update this listing.");
    } finally {
      setBusyListingId(null);
    }
  }

  async function removeListing(listing: Listing) {
    setBusyListingId(listing.id);
    setDataError("");
    try {
      const response = await fetch(`/api/admin/opportunities/${encodeURIComponent(listing.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Unable to remove this listing. Please try again.");
      }
      setListings((current) => current.filter((item) => item.id !== listing.id));
      setNotice("Listing removed.");
    } catch (error) {
      console.error("Unable to remove listing:", error);
      setDataError(error instanceof Error ? error.message : "Unable to remove this listing.");
    } finally {
      setBusyListingId(null);
    }
  }

  const activeCount = listings.filter((listing) => listing.status === "Active").length;
  const pendingCount = listings.filter((listing) => listing.status === "Pending").length;
  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.organization} ${member.role}`.toLowerCase().includes(search.toLowerCase().trim()),
  );
  const monthlyActivity = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - 4 + index, 1);
      const start = month.getTime();
      const end = nextMonth.getTime();
      const opportunityCount = listings.filter((listing) => {
        const createdAt = Date.parse(listing.createdAt);
        return createdAt >= start && createdAt < end;
      }).length;
      const memberCount = members.filter((member) => {
        const joinedAt = Date.parse(member.joinedAt);
        return joinedAt >= start && joinedAt < end;
      }).length;

      return {
        label: month.toLocaleDateString("en-US", { month: "short" }),
        total: opportunityCount + memberCount,
      };
    });
  }, [listings, members]);
  const maxMonthlyActivity = Math.max(1, ...monthlyActivity.map((month) => month.total));

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/" aria-label="Opportunity Hub home">
          <BrandMark />
          <span><strong>opportunity</strong><small>HUB <i>•</i> PALATINE</small></span>
        </Link>

        <div className="admin-workspace-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map((item) => (
            <button
              className={`admin-nav-item${section === item.label ? " is-current" : ""}`}
              key={item.label}
              type="button"
              aria-current={section === item.label ? "page" : undefined}
              onClick={() => {
                setSection(item.label);
                setNotice("");
              }}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.label === "Opportunities" && pendingCount > 0 && (
                <span className="admin-nav-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-help-card">
            <span className="admin-help-spark">✳</span>
            <strong>Here for the community.</strong>
            <p>Growing opportunity, one local connection at a time.</p>
          </div>
          <Link className="admin-back-link" href="/">
            <Icon name="arrow" size={16} /> Back to website
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{section}</strong></div>
          <div className="admin-topbar-right">
            <span className="admin-preview-chip"><span /> Local database</span>
            <span className="admin-avatar" aria-label="Administrator">A</span>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-demo-notice" role="note">
            <span className="admin-notice-mark">i</span>
            <p><strong>Local mode</strong> — Changes are stored in MongoDB on this machine. This admin workspace has no sign-in and must not be exposed publicly.</p>
          </div>

          {notice && <p className="admin-action-notice" role="status"><Icon name="check" size={15} />{notice}</p>}
          {dataError && <p className="data-error" role="alert">{dataError}</p>}

          <div className="admin-page-heading">
            <div>
              <div className="admin-eyebrow"><span /> PALATINE AREA • COMMUNITY ADMIN</div>
              <h1>{section === "Overview" ? <>A little good <em>goes a long way.</em></> : section}</h1>
              <p>{section === "Overview"
                ? "Your community is growing. Here’s the latest from Opportunity Hub."
                : section === "Opportunities"
                  ? "Review local openings and keep the community’s next steps moving."
                  : "Get to know the people building a more connected Palatine."}</p>
            </div>
            <button className="admin-primary-button" type="button" onClick={() => { setShowForm(true); setNotice(""); }}>
              <Icon name="plus" size={17} /> Add opportunity
            </button>
          </div>

          {section !== "Members" && (
            <>
              <section className="admin-stats" aria-label="Community overview">
                <article className="admin-stat-card">
                  <div className="admin-stat-top"><span>Total opportunities</span><span className="admin-stat-icon peach"><Icon name="briefcase" size={17} /></span></div>
                  <strong>{listings.length}</strong>
                  <p>Across all listing statuses</p>
                  <div className="admin-sparkline sparkline-peach" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>
                <article className="admin-stat-card">
                  <div className="admin-stat-top"><span>Active listings</span><span className="admin-stat-icon green"><Icon name="eye" size={17} /></span></div>
                  <strong>{activeCount}</strong>
                  <p>Currently visible to visitors</p>
                  <div className="admin-sparkline sparkline-green" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>
                <article className="admin-stat-card">
                  <div className="admin-stat-top"><span>Community members</span><span className="admin-stat-icon blue"><Icon name="users" size={17} /></span></div>
                  <strong>{members.length}</strong>
                  <p>Stored in the member collection</p>
                  <div className="admin-sparkline sparkline-blue" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>
                <article className="admin-stat-card">
                  <div className="admin-stat-top"><span>Awaiting review</span><span className="admin-stat-icon gold"><Icon name="calendar" size={17} /></span></div>
                  <strong>{pendingCount}</strong>
                  <p>{pendingCount ? "Ready for your review" : "You’re all caught up"}</p>
                  <div className="admin-sparkline sparkline-gold" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>
              </section>

              {section === "Overview" && (
                <section className="admin-insights">
                  <article className="admin-panel-card admin-activity-card">
                    <div className="admin-card-heading">
                      <div><h2>Community activity</h2><p>A snapshot of what’s happening around here.</p></div>
                      <button className="admin-period-button" type="button">Last 6 months <span>⌄</span></button>
                    </div>
                    <div className="admin-chart">
                      <div className="admin-chart-labels"><span>{maxMonthlyActivity}</span><span>{Math.round(maxMonthlyActivity * 0.67)}</span><span>{Math.round(maxMonthlyActivity * 0.33)}</span><span>0</span></div>
                      <div className="admin-chart-plot">
                        <div className="admin-chart-grid"><i /><i /><i /><i /></div>
                        <div className="admin-chart-bars" aria-label="Monthly opportunities and member registrations over the last six months">
                          {monthlyActivity.map((month, index) => (
                            <span key={month.label + index} style={{ height: `${(month.total / maxMonthlyActivity) * 100}%` }} className={index === 5 ? "highlight" : ""} />
                          ))}
                        </div>
                        <div className="admin-chart-months">{monthlyActivity.map((month, index) => <span key={month.label + index}>{month.label}</span>)}</div>
                      </div>
                    </div>
                    <div className="admin-chart-legend"><span><i /> New opportunities and members</span></div>
                  </article>
                  <article className="admin-panel-card admin-welcome-card">
                    <div className="admin-welcome-art"><span>✳</span><i /><i /><i /></div>
                    <div className="admin-eyebrow"><span /> YOUR COMMUNITY, IN MOTION</div>
                    <h2>Make room for<br /><em>what’s next.</em></h2>
                    <p>Every new opening is a chance for a neighbor to find their next step.</p>
                    <button className="admin-inline-link" type="button" onClick={() => setSection("Opportunities")}>Explore your listings <Icon name="arrow" size={15} /></button>
                  </article>
                </section>
              )}

              <section className="admin-panel-card admin-listings-card">
                <div className="admin-card-heading admin-listings-heading">
                  <div><h2>{section === "Overview" ? "Recent opportunities" : "All opportunities"}</h2><p>Manage openings shared with the Palatine community.</p></div>
                  {section === "Overview" && <button className="admin-text-button" type="button" onClick={() => setSection("Opportunities")}>View all <Icon name="arrow" size={14} /></button>}
                </div>
                <div className="admin-table-toolbar">
                  <label className="admin-search">
                    <Icon name="search" size={16} />
                    <input aria-label="Search opportunities" placeholder="Search opportunities..." value={search} onChange={(event) => setSearch(event.target.value)} />
                  </label>
                  <label className="admin-filter">
                    <span className="visually-hidden">Filter listings by status</span>
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                      <option>All listings</option>
                      <option>Active</option>
                      <option>Pending</option>
                      <option>Expired</option>
                    </select>
                  </label>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead><tr><th>OPPORTUNITY</th><th>TYPE</th><th>STATUS</th><th>POSTED</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                    <tbody>
                      {(section === "Overview" ? filteredListings.slice(0, 4) : filteredListings).map((listing) => (
                        <tr key={listing.id}>
                          <td>
                            <div className="admin-listing-cell">
                              <span className={`admin-org-avatar tone-${listing.id.charCodeAt(0) % 3}`}>{listing.organization.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase()}</span>
                              <span><strong>{listing.title}</strong><small>{listing.organization}</small></span>
                            </div>
                          </td>
                          <td><span className="admin-type-label">{listing.type}</span></td>
                          <td><StatusBadge status={listing.status} /></td>
                          <td className="admin-date-cell">{formatDate(listing.createdAt)}</td>
                          <td>
                            <div className="admin-row-actions">
                              <button type="button" disabled={busyListingId === listing.id} aria-label={listing.status === "Active" ? `Pause ${listing.title}` : `Publish ${listing.title}`} title={listing.status === "Active" ? "Move to pending" : "Publish listing"} onClick={() => void toggleListingStatus(listing)}><Icon name={listing.status === "Active" ? "close" : "check"} size={15} /></button>
                              <button type="button" disabled={busyListingId === listing.id} aria-label={`Remove ${listing.title}`} title="Remove listing" onClick={() => void removeListing(listing)}><Icon name="more" size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {isLoading && <tr><td className="admin-table-empty" colSpan={5}>Loading opportunities…</td></tr>}
                      {!isLoading && filteredListings.length === 0 && <tr><td className="admin-table-empty" colSpan={5}>No listings match your search.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="admin-table-footer"><span>Showing {section === "Overview" ? Math.min(4, filteredListings.length) : filteredListings.length} of {filteredListings.length} listings</span><span>Local MongoDB data</span></div>
              </section>
            </>
          )}

          {section === "Members" && (
            <section className="admin-panel-card admin-members-card">
              <div className="admin-card-heading"><div><h2>Community members</h2><p>Local businesses and partners growing together.</p></div><span className="admin-member-total">{members.length} members</span></div>
              <div className="admin-table-toolbar">
                <label className="admin-search"><Icon name="search" size={16} /><input aria-label="Search members" placeholder="Search members..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>MEMBER</th><th>ORGANIZATION</th><th>MEMBERSHIP</th><th>JOINED</th></tr></thead>
                  <tbody>{filteredMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td><div className="admin-listing-cell"><span className={`admin-member-avatar ${["peach", "sage", "blue", "lavender"][index % 4]}`}>{memberInitials(member.name)}</span><span><strong>{member.name}</strong><small>Community member</small></span></div></td>
                      <td className="admin-member-org">{member.organization}</td><td><span className="admin-type-label">{member.role}</span></td><td className="admin-date-cell">{formatDate(member.joinedAt)}</td>
                    </tr>
                  ))}
                    {isLoading && <tr><td className="admin-table-empty" colSpan={4}>Loading community members…</td></tr>}
                    {!isLoading && filteredMembers.length === 0 && <tr><td className="admin-table-empty" colSpan={4}>No members match your search.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="admin-table-footer"><span>Showing {filteredMembers.length} members</span><span>Local MongoDB data</span></div>
            </section>
          )}

          <footer className="admin-footer"><span>Opportunity Hub <i>•</i> Palatine</span><span>Made for this community <b>✳</b></span></footer>
        </main>
      </div>

      {showForm && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
            <div className="admin-modal-heading"><div><div className="admin-eyebrow"><span /> SHARE AN OPENING</div><h2 id="admin-form-title">Add an opportunity</h2></div><button type="button" aria-label="Close form" onClick={() => setShowForm(false)}><Icon name="close" size={18} /></button></div>
            <p className="admin-modal-description">Create a listing for a neighbor’s next big thing.</p>
            <form onSubmit={addListing}>
              <label>Opening title<input name="title" required maxLength={90} placeholder="e.g. Marketing Coordinator" /></label>
              <label>Business or organization<input name="organization" required maxLength={70} placeholder="Your organization name" /></label>
              <label>Opportunity type<select name="type" defaultValue="Job"><option>Job</option><option>Internship</option><option>Volunteering</option></select></label>
              <div className="admin-modal-actions"><button className="admin-cancel-button" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="admin-primary-button" type="submit" disabled={isSavingListing}><Icon name="plus" size={16} /> {isSavingListing ? "Saving…" : "Add listing"}</button></div>
            </form>
              <p className="admin-modal-footnote">Listings are saved to the local MongoDB database and start pending review.</p>
          </section>
        </div>
      )}
    </div>
  );
}
