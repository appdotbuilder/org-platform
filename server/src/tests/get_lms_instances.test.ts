import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { organizationsTable, lmsInstancesTable } from '../db/schema';
import { getLmsInstances } from '../handlers/get_lms_instances';

describe('getLmsInstances', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no LMS instances exist for organization', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    const result = await getLmsInstances(org.id);

    expect(result).toEqual([]);
  });

  it('should return LMS instances for specific organization', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Test Organization',
        slug: 'test-org',
        description: null
      })
      .returning()
      .execute();

    // Create LMS instances for this organization
    const [lms1] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Main LMS',
        slug: 'main-lms',
        description: 'Primary learning management system'
      })
      .returning()
      .execute();

    const [lms2] = await db.insert(lmsInstancesTable)
      .values({
        organization_id: org.id,
        name: 'Training LMS',
        slug: 'training-lms',
        description: null
      })
      .returning()
      .execute();

    const result = await getLmsInstances(org.id);

    expect(result).toHaveLength(2);
    
    // Verify first LMS instance
    expect(result[0].id).toEqual(lms1.id);
    expect(result[0].organization_id).toEqual(org.id);
    expect(result[0].name).toEqual('Main LMS');
    expect(result[0].slug).toEqual('main-lms');
    expect(result[0].description).toEqual('Primary learning management system');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second LMS instance
    expect(result[1].id).toEqual(lms2.id);
    expect(result[1].organization_id).toEqual(org.id);
    expect(result[1].name).toEqual('Training LMS');
    expect(result[1].slug).toEqual('training-lms');
    expect(result[1].description).toBeNull();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should only return LMS instances for the specified organization', async () => {
    // Create two organizations
    const [org1] = await db.insert(organizationsTable)
      .values({
        name: 'Organization 1',
        slug: 'org-1',
        description: null
      })
      .returning()
      .execute();

    const [org2] = await db.insert(organizationsTable)
      .values({
        name: 'Organization 2',
        slug: 'org-2',
        description: null
      })
      .returning()
      .execute();

    // Create LMS instances for both organizations
    await db.insert(lmsInstancesTable)
      .values({
        organization_id: org1.id,
        name: 'Org 1 LMS',
        slug: 'org1-lms',
        description: null
      })
      .execute();

    await db.insert(lmsInstancesTable)
      .values({
        organization_id: org2.id,
        name: 'Org 2 LMS Alpha',
        slug: 'org2-lms-alpha',
        description: null
      })
      .execute();

    await db.insert(lmsInstancesTable)
      .values({
        organization_id: org2.id,
        name: 'Org 2 LMS Beta',
        slug: 'org2-lms-beta',
        description: null
      })
      .execute();

    // Get LMS instances for organization 1
    const org1Result = await getLmsInstances(org1.id);
    expect(org1Result).toHaveLength(1);
    expect(org1Result[0].name).toEqual('Org 1 LMS');
    expect(org1Result[0].organization_id).toEqual(org1.id);

    // Get LMS instances for organization 2
    const org2Result = await getLmsInstances(org2.id);
    expect(org2Result).toHaveLength(2);
    expect(org2Result[0].name).toEqual('Org 2 LMS Alpha');
    expect(org2Result[0].organization_id).toEqual(org2.id);
    expect(org2Result[1].name).toEqual('Org 2 LMS Beta');
    expect(org2Result[1].organization_id).toEqual(org2.id);
  });

  it('should return empty array for non-existent organization', async () => {
    const nonExistentOrgId = 99999;
    
    const result = await getLmsInstances(nonExistentOrgId);

    expect(result).toEqual([]);
  });

  it('should handle multiple LMS instances with various field values', async () => {
    // Create organization
    const [org] = await db.insert(organizationsTable)
      .values({
        name: 'Multi LMS Organization',
        slug: 'multi-lms-org',
        description: 'Organization with multiple LMS instances'
      })
      .returning()
      .execute();

    // Create LMS instances with different field combinations
    await db.insert(lmsInstancesTable)
      .values([
        {
          organization_id: org.id,
          name: 'Corporate Training',
          slug: 'corporate-training',
          description: 'For employee onboarding and training'
        },
        {
          organization_id: org.id,
          name: 'Customer Education',
          slug: 'customer-education',
          description: null
        },
        {
          organization_id: org.id,
          name: 'Partner Portal',
          slug: 'partner-portal',
          description: 'Training for business partners'
        }
      ])
      .execute();

    const result = await getLmsInstances(org.id);

    expect(result).toHaveLength(3);
    
    // Verify all instances belong to the correct organization
    result.forEach(lms => {
      expect(lms.organization_id).toEqual(org.id);
      expect(lms.id).toBeDefined();
      expect(lms.name).toBeDefined();
      expect(lms.slug).toBeDefined();
      expect(lms.created_at).toBeInstanceOf(Date);
      expect(lms.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific instances
    const corporateTraining = result.find(lms => lms.name === 'Corporate Training');
    expect(corporateTraining).toBeDefined();
    expect(corporateTraining!.description).toEqual('For employee onboarding and training');

    const customerEducation = result.find(lms => lms.name === 'Customer Education');
    expect(customerEducation).toBeDefined();
    expect(customerEducation!.description).toBeNull();

    const partnerPortal = result.find(lms => lms.name === 'Partner Portal');
    expect(partnerPortal).toBeDefined();
    expect(partnerPortal!.description).toEqual('Training for business partners');
  });
});