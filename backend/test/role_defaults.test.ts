import { describe, it, expect } from 'vitest';
// Import testUtils to ensure MongoMemoryServer lifecycle hooks run
import './testUtils';
import User from '../src/models/User';

// Tests automatic assignment of default permissions via pre-save hook

describe('Role default permissions', () => {
  it('assigns full template to new Admin when permissions omitted', async () => {
    const admin = await new User({
      name: 'Auto Admin',
      email: `auto-admin-${Date.now()}@test.com`,
      password: 'Password123!',
      type: 'Admin'
    } as any).save();
    expect(admin.permissions.students?.create).toBe(true);
    expect(admin.permissions.students?.read).toBe(true);
  });

  it('does not overwrite explicit permissions', async () => {
    const lect = await new User({
      name: 'Lecturer Custom',
      email: `lect-custom-${Date.now()}@test.com`,
      password: 'Password123!',
      type: 'Lecturer',
      permissions: { students: { read: true } }
    } as any).save();
    // Should only have specified permissions, not injected update/export
    expect(lect.permissions.students?.read).toBe(true);
    expect(lect.permissions.students?.update).toBeUndefined();
  });
});
