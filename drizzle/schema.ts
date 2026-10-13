import {
    pgTable,
    pgEnum,
    uuid,
    text,
    timestamp,
} from 'drizzle-orm/pg-core';

export const campusRoleEnum = pgEnum('campus_role', [
    'Super Admin',
    'Facilities Manager',
    'Security Manager',
    'Sustainability Officer',
    'Student',
]);

export const campusProfiles = pgTable('campus_profiles', {
    userId: uuid('user_id').primaryKey(),
    displayName: text('display_name'),
    email: text('email'),
    role: campusRoleEnum('role').notNull().default('Super Admin'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campusRecords = pgTable('campus_records', {
    refCode: text('ref_code').primaryKey(),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    building: text('building').notNull().default(''),
    category: text('category').notNull().default(''),
    priority: text('priority').notNull().default('Medium'),
    status: text('status').notNull().default('Reported'),
    team: text('team').notNull().default(''),
    photo: text('photo'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campusRecordEvents = pgTable('campus_record_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    recordRef: text('record_ref').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
