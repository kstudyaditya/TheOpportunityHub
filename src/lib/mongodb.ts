import { MongoClient, type Db, type Collection } from "mongodb";
import type {
  MemberRecord,
  OpportunityRecord,
  OpportunityStatus,
  OpportunityType,
} from "@/lib/opportunity-types";

type OpportunityDocument = Omit<OpportunityRecord, "id" | "createdAt"> & {
  _id: string;
  createdAt: Date;
};

type MemberDocument = Omit<MemberRecord, "id" | "joinedAt"> & {
  _id: string;
  joinedAt: Date;
};

type MongoCache = {
  client: MongoClient | null;
  database: Promise<Db> | null;
};

const globalForMongo = globalThis as typeof globalThis & {
  opportunityHubMongo?: MongoCache;
};

const mongoCache = (globalForMongo.opportunityHubMongo ??= {
  client: null,
  database: null,
});

const initialOpportunities: OpportunityDocument[] = [
  {
    _id: "seed-community-engagement-coordinator",
    type: "Job",
    title: "Community Engagement Coordinator",
    organization: "Palatine Park District",
    location: "Palatine, IL",
    status: "Active",
    createdAt: new Date("2026-10-10T12:00:00.000Z"),
  },
  {
    _id: "seed-community-marketing-intern",
    type: "Internship",
    title: "Community Marketing Intern",
    organization: "Palatine Area Chamber",
    location: "Palatine, IL",
    status: "Active",
    createdAt: new Date("2026-10-08T12:00:00.000Z"),
  },
  {
    _id: "seed-neighborhood-cleanup-volunteer",
    type: "Volunteering",
    title: "Neighborhood Cleanup Volunteer",
    organization: "Palatine Park District",
    location: "Palatine, IL",
    status: "Active",
    createdAt: new Date("2026-10-07T12:00:00.000Z"),
  },
  {
    _id: "seed-small-business-bookkeeper",
    type: "Job",
    title: "Small Business Bookkeeper",
    organization: "Northwest Community Co-op",
    location: "Palatine, IL",
    status: "Pending",
    createdAt: new Date("2026-10-03T12:00:00.000Z"),
  },
  {
    _id: "seed-fall-festival-assistant",
    type: "Volunteering",
    title: "Fall Festival Event Assistant",
    organization: "Palatine Events Collective",
    location: "Palatine, IL",
    status: "Expired",
    createdAt: new Date("2026-09-18T12:00:00.000Z"),
  },
];

const initialMembers: MemberDocument[] = [
  {
    _id: "seed-maya-patel",
    name: "Maya Patel",
    organization: "Palatine Area Chamber",
    role: "Business member",
    joinedAt: new Date("2026-10-09T12:00:00.000Z"),
  },
  {
    _id: "seed-jordan-lee",
    name: "Jordan Lee",
    organization: "Palatine Park District",
    role: "Community partner",
    joinedAt: new Date("2026-10-06T12:00:00.000Z"),
  },
  {
    _id: "seed-elena-garcia",
    name: "Elena Garcia",
    organization: "Garcia & Co.",
    role: "Business member",
    joinedAt: new Date("2026-10-02T12:00:00.000Z"),
  },
  {
    _id: "seed-noah-williams",
    name: "Noah Williams",
    organization: "Palatine Library",
    role: "Community partner",
    joinedAt: new Date("2026-09-28T12:00:00.000Z"),
  },
];

async function ensureCollection(db: Db, name: string) {
  const exists = await db.listCollections({ name }, { nameOnly: true }).hasNext();
  if (!exists) {
    await db.createCollection(name);
  }
}

async function initializeDatabase(db: Db) {
  await Promise.all([
    ensureCollection(db, "opportunities"),
    ensureCollection(db, "members"),
    ensureCollection(db, "app_metadata"),
  ]);

  const opportunities = db.collection<OpportunityDocument>("opportunities");
  const members = db.collection<MemberDocument>("members");
  const metadata = db.collection<{ _id: string; createdAt: Date }>("app_metadata");

  await Promise.all([
    opportunities.createIndex({ status: 1, createdAt: -1 }),
    members.createIndex({ joinedAt: -1 }),
  ]);

  const seedMarker = { _id: "initial-preview-data-v1" };
  if (!(await metadata.findOne(seedMarker))) {
    if ((await opportunities.estimatedDocumentCount()) === 0) {
      await opportunities.insertMany(initialOpportunities);
    }
    if ((await members.estimatedDocumentCount()) === 0) {
      await members.insertMany(initialMembers);
    }
    await metadata.updateOne(
      seedMarker,
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  }
}

export async function getDatabase(): Promise<Db> {
  if (!mongoCache.database) {
    mongoCache.database = (async () => {
      const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
      const databaseName = process.env.MONGODB_DATABASE ?? "opportunity_hub";
      const client = new MongoClient(uri);
      mongoCache.client = client;

      try {
        await client.connect();
        const db = client.db(databaseName);
        await initializeDatabase(db);
        return db;
      } catch (error) {
        await client.close();
        mongoCache.client = null;
        mongoCache.database = null;
        throw error;
      }
    })();
  }

  return mongoCache.database;
}

export function opportunitiesCollection(db: Db): Collection<OpportunityDocument> {
  return db.collection<OpportunityDocument>("opportunities");
}

export function membersCollection(db: Db): Collection<MemberDocument> {
  return db.collection<MemberDocument>("members");
}

export function toOpportunityRecord(document: OpportunityDocument): OpportunityRecord {
  const { _id, createdAt, ...fields } = document;
  return { id: _id, ...fields, createdAt: createdAt.toISOString() };
}

export function toMemberRecord(document: MemberDocument): MemberRecord {
  const { _id, joinedAt, ...fields } = document;
  return { id: _id, ...fields, joinedAt: joinedAt.toISOString() };
}

export function isOpportunityType(value: unknown): value is OpportunityType {
  return value === "Job" || value === "Internship" || value === "Volunteering";
}

export function isOpportunityStatus(value: unknown): value is OpportunityStatus {
  return value === "Active" || value === "Pending" || value === "Expired";
}
