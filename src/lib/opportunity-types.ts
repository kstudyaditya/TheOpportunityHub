export type OpportunityType = "Job" | "Internship" | "Volunteering";
export type OpportunityStatus = "Active" | "Pending" | "Expired";

export type OpportunityRecord = {
  id: string;
  type: OpportunityType;
  title: string;
  organization: string;
  location: string;
  status: OpportunityStatus;
  createdAt: string;
};

export type MemberRecord = {
  id: string;
  name: string;
  organization: string;
  role: string;
  joinedAt: string;
};
