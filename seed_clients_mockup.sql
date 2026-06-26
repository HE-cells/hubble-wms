-- ============================================================
-- Mockup Client & Project Seed
-- Run in Supabase Studio → SQL Editor
-- WARNING: deletes ALL existing clients and projects first.
-- Projects must be cleared before clients (FK constraint).
-- ============================================================

-- 1. Wipe existing data (order matters: projects → clients)
DELETE FROM projects;
DELETE FROM clients;

-- 2. Insert clients
INSERT INTO clients (id, name, address, currency, is_active) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Weyland-Yutani Corp',          '1 Weyland House, Canary Wharf, London E14 5AB, United Kingdom',                  'GBP', true),
  ('c0000001-0000-0000-0000-000000000002', 'Stark Industries',              '200 Park Avenue, New York, NY 10166, USA',                                         'USD', true),
  ('c0000001-0000-0000-0000-000000000003', 'Cyberdyne Systems',             '18144 El Camino Real, Sunnyvale, CA 94087, USA',                                   'USD', true),
  ('c0000001-0000-0000-0000-000000000004', 'Tyrell Corporation',            '666 Tyrell Tower, Los Angeles, CA 90001, USA',                                     'USD', true),
  ('c0000001-0000-0000-0000-000000000005', 'Umbrella Corporation',          'Umbrella House, 4 Aeschenvorstadt, 4051 Basel, Switzerland',                      'CHF', true),
  ('c0000001-0000-0000-0000-000000000006', 'Nakatomi Corporation',          '2-1-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005, Japan',                             'JPY', true),
  ('c0000001-0000-0000-0000-000000000007', 'Delos Incorporated',            '8300 East Raintree Drive, Scottsdale, AZ 85260, USA',                             'USD', true),
  ('c0000001-0000-0000-0000-000000000008', 'Blue Sun Corporation',          '88 Blue Sun Boulevard, Chaoyang District, Beijing 100020, China',                 'CNY', true),
  ('c0000001-0000-0000-0000-000000000009', 'Tessier-Ashpool SA',            '14 Boulevard Royal, L-2449 Luxembourg City, Luxembourg',                          'EUR', true),
  ('c0000001-0000-0000-0000-000000000010', 'Omni Consumer Products',        '100 Renaissance Center, Detroit, MI 48243, USA',                                  'USD', true),
  ('c0000001-0000-0000-0000-000000000011', 'Saeder-Krupp Heavy Industries', 'Saeder-Krupp-Platz 1, 60311 Frankfurt am Main, Germany',                          'EUR', true),
  ('c0000001-0000-0000-0000-000000000012', 'Shinra Electric Power Co.',     '1-1 Shinra Building, Chiyoda-ku, Tokyo 100-0001, Japan',                          'JPY', true),
  ('c0000001-0000-0000-0000-000000000013', 'Abstergo Industries',           '1000 De La Gauchetière Street West, Montréal, QC H3B 4W5, Canada',               'CAD', true),
  ('c0000001-0000-0000-0000-000000000014', 'Sirius Cybernetics Corp',       '42 Infinite Improbability Drive, Magrathea Business Park, Outer Western Spiral Arm', 'GBP', true),
  ('c0000001-0000-0000-0000-000000000015', 'InGen Technologies',            '7760 Fay Avenue, La Jolla, San Diego, CA 92037, USA',                             'USD', true),
  ('c0000001-0000-0000-0000-000000000016', 'Massive Dynamic',               '890 Winter Street, Waltham, MA 02451, USA',                                       'USD', true),
  ('c0000001-0000-0000-0000-000000000017', 'Arasaka Corporation',           '1-1 Arasaka Tower, Shinjuku, Tokyo 160-0023, Japan',                             'JPY', true),
  ('c0000001-0000-0000-0000-000000000018', 'Vault-Tec Corporation',         '1 Vault-Tec Plaza, Washington D.C., DC 20001, USA',                               'USD', true),
  ('c0000001-0000-0000-0000-000000000019', 'Concordance Extraction Corp',   '2211 Norfolk Street, Suite 100, Houston, TX 77098, USA',                          'USD', true),
  ('c0000001-0000-0000-0000-000000000020', 'Biotechnica',                   'Via della Conciliazione 10, 00193 Rome, Italy',                                   'EUR', true),
  ('c0000001-0000-0000-0000-000000000021', 'Fragile Express',               'Capital Knot City, Eastern Seaboard, USA',                                        'USD', true),
  ('c0000001-0000-0000-0000-000000000022', 'ARMS Tech',                     '1700 Research Boulevard, Rockville, MD 20850, USA',                               'USD', true);

-- 3. Insert projects
INSERT INTO projects (name, client_id, color, access, is_billable, is_archived) VALUES

  -- Weyland-Yutani Corp
  ('Nostromo Fleet Cargo Management',        'c0000001-0000-0000-0000-000000000001', '#607d8b', 'public', true, false),
  ('LV-426 Terraforming Operations',         'c0000001-0000-0000-0000-000000000001', '#607d8b', 'public', true, false),
  ('Bio-Weapons Division R&D Tracker',       'c0000001-0000-0000-0000-000000000001', '#607d8b', 'public', true, false),

  -- Stark Industries
  ('Iron Man Suit Inventory & Maintenance',  'c0000001-0000-0000-0000-000000000002', '#f44336', 'public', true, false),
  ('Avengers Tower Facility Management',     'c0000001-0000-0000-0000-000000000002', '#f44336', 'public', true, false),
  ('Arc Reactor Clean Energy Grid',          'c0000001-0000-0000-0000-000000000002', '#f44336', 'public', true, false),

  -- Cyberdyne Systems
  ('Skynet Infrastructure Development',      'c0000001-0000-0000-0000-000000000003', '#9e9e9e', 'public', true, false),
  ('T-Series Production Scheduling',         'c0000001-0000-0000-0000-000000000003', '#9e9e9e', 'public', true, false),
  ('Defense Systems Compliance Audit',       'c0000001-0000-0000-0000-000000000003', '#9e9e9e', 'public', true, false),

  -- Tyrell Corporation
  ('Nexus-6 Replicant Production Log',       'c0000001-0000-0000-0000-000000000004', '#ff9800', 'public', true, false),
  ('Off-World Colony Staffing Placement',    'c0000001-0000-0000-0000-000000000004', '#ff9800', 'public', true, false),
  ('Baseline Test Administration Portal',    'c0000001-0000-0000-0000-000000000004', '#ff9800', 'public', true, false),

  -- Umbrella Corporation
  ('Hive Facility Security & Access Control','c0000001-0000-0000-0000-000000000005', '#4caf50', 'public', true, false),
  ('T-Virus Research Compound Management',   'c0000001-0000-0000-0000-000000000005', '#4caf50', 'public', true, false),
  ('Raccoon City Distribution Network',      'c0000001-0000-0000-0000-000000000005', '#4caf50', 'public', true, false),

  -- Nakatomi Corporation
  ('Nakatomi Plaza Asset Management',        'c0000001-0000-0000-0000-000000000006', '#e91e63', 'public', true, false),
  ('Pacific Rim Trade Finance Portal',       'c0000001-0000-0000-0000-000000000006', '#e91e63', 'public', true, false),
  ('Osaka Headquarters Renovation',          'c0000001-0000-0000-0000-000000000006', '#e91e63', 'public', true, false),

  -- Delos Incorporated
  ('Westworld Host Behavioral Loop Tracker', 'c0000001-0000-0000-0000-000000000007', '#795548', 'public', true, false),
  ('Mesa Hub Maintenance Operations',        'c0000001-0000-0000-0000-000000000007', '#795548', 'public', true, false),
  ('Guest Experience Data Analytics',        'c0000001-0000-0000-0000-000000000007', '#795548', 'public', true, false),

  -- Blue Sun Corporation
  ('Rim World Supply Chain Logistics',       'c0000001-0000-0000-0000-000000000008', '#ff5722', 'public', true, false),
  ('Cortex Advertising Campaign Management', 'c0000001-0000-0000-0000-000000000008', '#ff5722', 'public', true, false),
  ('Alliance Trade Compliance Portal',       'c0000001-0000-0000-0000-000000000008', '#ff5722', 'public', true, false),

  -- Tessier-Ashpool SA
  ('Freeside Station Asset Registry',        'c0000001-0000-0000-0000-000000000009', '#9c27b0', 'public', true, false),
  ('Straylight Villa Estate Management',     'c0000001-0000-0000-0000-000000000009', '#9c27b0', 'public', true, false),
  ('Wintermute AI Integration Audit',        'c0000001-0000-0000-0000-000000000009', '#9c27b0', 'public', true, false),

  -- Omni Consumer Products
  ('Delta City Urban Development',           'c0000001-0000-0000-0000-000000000010', '#3f51b5', 'public', true, false),
  ('ED-209 Deployment & Maintenance',        'c0000001-0000-0000-0000-000000000010', '#3f51b5', 'public', true, false),
  ('Metro West Privatisation Initiative',    'c0000001-0000-0000-0000-000000000010', '#3f51b5', 'public', true, false),

  -- Saeder-Krupp Heavy Industries
  ('Rhine-Ruhr Industrial Expansion',        'c0000001-0000-0000-0000-000000000011', '#ff6f00', 'public', true, false),
  ('Dragon''s Hoard Asset Management',       'c0000001-0000-0000-0000-000000000011', '#ff6f00', 'public', true, false),
  ('Corporate Security Audit Programme',     'c0000001-0000-0000-0000-000000000011', '#ff6f00', 'public', true, false),

  -- Shinra Electric Power Co.
  ('Mako Reactor Energy Grid Management',    'c0000001-0000-0000-0000-000000000012', '#2196f3', 'public', true, false),
  ('SOLDIER Programme HR Operations',        'c0000001-0000-0000-0000-000000000012', '#2196f3', 'public', true, false),
  ('Sector 7 Infrastructure Development',    'c0000001-0000-0000-0000-000000000012', '#2196f3', 'public', true, false),

  -- Abstergo Industries
  ('Animus Project Data Collection',         'c0000001-0000-0000-0000-000000000013', '#ffc107', 'public', true, false),
  ('Eagle Vision Product Development',       'c0000001-0000-0000-0000-000000000013', '#ffc107', 'public', true, false),
  ('Templar Asset Acquisition Programme',    'c0000001-0000-0000-0000-000000000013', '#ffc107', 'public', true, false),

  -- Sirius Cybernetics Corp
  ('Genuine People Personalities QA',        'c0000001-0000-0000-0000-000000000014', '#00bcd4', 'public', true, false),
  ('Marvin Field-Service Management',        'c0000001-0000-0000-0000-000000000014', '#00bcd4', 'public', true, false),
  ('Pan-Galactic Distribution Logistics',    'c0000001-0000-0000-0000-000000000014', '#00bcd4', 'public', true, false),

  -- InGen Technologies
  ('Isla Nublar Facility Operations',        'c0000001-0000-0000-0000-000000000015', '#8bc34a', 'public', true, false),
  ('Dinosaur Genome Sequencing Project',     'c0000001-0000-0000-0000-000000000015', '#8bc34a', 'public', true, false),
  ('Jurassic Park Guest Safety Programme',   'c0000001-0000-0000-0000-000000000015', '#8bc34a', 'public', true, false),

  -- Massive Dynamic
  ('Pattern Event Investigation Portal',     'c0000001-0000-0000-0000-000000000016', '#673ab7', 'public', true, false),
  ('ZFT Research Grant Administration',      'c0000001-0000-0000-0000-000000000016', '#673ab7', 'public', true, false),
  ('Cortexiphan Clinical Trial Management',  'c0000001-0000-0000-0000-000000000016', '#673ab7', 'public', true, false),

  -- Arasaka Corporation
  ('Night City Security Operations',         'c0000001-0000-0000-0000-000000000017', '#f50057', 'public', true, false),
  ('Soulkiller Data Extraction Programme',   'c0000001-0000-0000-0000-000000000017', '#f50057', 'public', true, false),
  ('Arasaka Tower Corporate Affairs',        'c0000001-0000-0000-0000-000000000017', '#f50057', 'public', true, false),

  -- Vault-Tec Corporation
  ('Vault Construction & Commissioning',     'c0000001-0000-0000-0000-000000000018', '#ffeb3b', 'public', true, false),
  ('GECK Resource Distribution',             'c0000001-0000-0000-0000-000000000018', '#ffeb3b', 'public', true, false),
  ('Post-War Resettlement Programme',        'c0000001-0000-0000-0000-000000000018', '#ffeb3b', 'public', true, false),

  -- Concordance Extraction Corp
  ('Ishimura Planetcracker Fleet Operations','c0000001-0000-0000-0000-000000000019', '#546e7a', 'public', true, false),
  ('Aegis VII Mining Site Management',       'c0000001-0000-0000-0000-000000000019', '#546e7a', 'public', true, false),
  ('RIG Suit Maintenance & Certification',   'c0000001-0000-0000-0000-000000000019', '#546e7a', 'public', true, false),

  -- Biotechnica
  ('Protein Farm Agricultural Operations',   'c0000001-0000-0000-0000-000000000020', '#66bb6a', 'public', true, false),
  ('Gene-Splice R&D Pipeline',               'c0000001-0000-0000-0000-000000000020', '#66bb6a', 'public', true, false),
  ('Night City Distribution Contract',       'c0000001-0000-0000-0000-000000000020', '#66bb6a', 'public', true, false),

  -- Fragile Express
  ('Strand Network Route Expansion',         'c0000001-0000-0000-0000-000000000021', '#ff7043', 'public', true, false),
  ('Chiral Network Relay Maintenance',       'c0000001-0000-0000-0000-000000000021', '#ff7043', 'public', true, false),
  ('Last-Mile Delivery Operations',          'c0000001-0000-0000-0000-000000000021', '#ff7043', 'public', true, false),

  -- ARMS Tech
  ('Metal Gear REX Development Programme',   'c0000001-0000-0000-0000-000000000022', '#78909c', 'public', true, false),
  ('DARPA Weapons Contract Management',      'c0000001-0000-0000-0000-000000000022', '#78909c', 'public', true, false),
  ('FOX-HOUND Equipment Procurement',        'c0000001-0000-0000-0000-000000000022', '#78909c', 'public', true, false);
