# UNHIMAS School Management System – Master Testing Checklist

> This file consolidates the comprehensive pre‑delivery checklist. The **Automation** column indicates whether an item is presently: `auto` (covered by existing automated tests/scripts), `partial` (some automated coverage), or `manual` (manual validation required). Update as coverage expands.

| Section | Item | Automation | Notes |
|---------|------|------------|-------|
| Environment | Frontend dev server starts | manual | Run `npm run dev` |
| Environment | Backend dev server starts | manual | Run `npm run dev` in `backend/` |
| Environment | DB connection established | partial | Health endpoint + startup log |
| Environment | Env vars load correctly | manual | .env review & runtime logs |
| Environment | CORS working | manual | Verify network tab (frontend -> backend) |
| Production | Frontend build succeeds | manual | `npm run build` (CI add) |
| Production | Docker image builds | manual | Build Dockerfile (not yet tested) |
| Production | Prod env vars configured | manual | Provide `.env.example` |
| Production | SSL configured | manual | Deployment infra step |
| Production | DB migrations run | manual | (No migration framework implemented) |
| Frontend Auth | Login page renders | manual | UI visual check |
| Frontend Auth | Role selector lists roles | manual | Confirm roles UX |
| Frontend Auth | Password visibility toggle | manual | UI toggle |
| Frontend Auth | Forgot password link | manual | Link navigation |
| Frontend Auth | Login form validation | manual | Empty + invalid format |
| Frontend Auth | Dark/light theme toggle | manual | Theme state persists |
| Frontend Auth | Responsive layouts | manual | Viewport testing |
| Frontend Auth | Keyboard shortcuts | manual | Confirm shortcuts exist/working |
| Dashboard | Sidebar expand/collapse | manual | Visual |
| Dashboard | Menu items & icons | manual | Visual enumeration |
| Dashboard | Breadcrumb updates | manual | Navigate pages |
| Dashboard | Quick stats placeholders | manual | Data correctness later |
| Dashboard | Charts render | manual | Visual + console errors |
| Dashboard | Calendar current month | manual | Visual |
| Dashboard | Header search | manual | Search interactions |
| Dashboard | Notifications dropdown | manual | Visual |
| Dashboard | User profile dropdown | manual | Visual |
| Forms | Student registration fields present | manual | UI coverage |
| Forms | File upload (profile picture) | partial | `/api/uploads/profile` tested soon |
| Forms | Validation error messages | manual | Trigger missing fields |
| Forms | Modal dialogs open/close | manual | Visual |
| Forms | Date pickers function | manual | Visual |
| Forms | Dropdowns populate | manual | Visual |
| Forms | Multi-step forms navigation | manual | Visual |
| UI | Toast notifications | manual | Visual + timing |
| UI | Loading spinners | manual | Simulate slow network |
| UI | Error states | manual | Force server 500 |
| UI | Empty states | manual | Clear collections |
| UI | Pagination | manual | Lists with > pageSize |
| UI | Filtering | manual | UI interactions |
| UI | Table sorting | manual | Sort headers |
| Backend API | Health check | auto | Covered in smoke/e2e script |
| Backend API | Auth login success/failure | planned | Will add auth tests |
| Backend API | CRUD endpoints status codes | partial | Programs/Departments tests |
| Backend API | Error handling correctness | partial | Validate 400/401/403 in tests |
| Backend API | Request validation | partial | 400 cases for missing fields |
| Backend API | Rate limiting | manual | Not implemented (?) |
| DB | Connection pool under load | manual | Load/perf test pending |
| DB | CRUD ops succeed | partial | Mongo memory tests |
| DB | Data validation rules | partial | Mongoose schema enforced |
| DB | Index effectiveness | manual | Need explain() review |
| DB | Transactions rollback | manual | Not heavily used currently |
| DB | Backup/restore | manual | Manual procedure |
| Files | Upload valid files | partial | Will add upload test |
| Files | Reject invalid sizes/types | manual | Need negative tests |
| Files | Access via URL | manual | GET /api/uploads/file/:id |
| Files | Deletion removes storage | manual | Need delete test |
| Security | JWT generation/validation | planned | Add auth unit tests |
| Security | Password hashing | manual | Inspect stored hash |
| Security | RBAC enforced | manual | Requires auth mocking tests |
| Security | Input sanitization | partial | Mongoose + regex escapes |
| Security | CORS headers | manual | Browser network tab |
| Security | Sensitive data not logged | manual | Review logs |
| Integration | Valid login | planned | Auth tests |
| Integration | Invalid login failure | planned | Auth tests |
| Integration | JWT stored & sent | manual | Browser dev tools |
| Integration | Token expiry redirect | manual | Expire token manually |
| Integration | Logout clears token | manual | UI action |
| Integration | Password reset flow | manual | Email infra needed |
| Integration | Role-based UI gating | manual | Login as different users |
| Students | Registration persists | manual | Add protected test in future |
| Students | Listing/search/filter | manual | UI & API query params |
| Students | Profile updates | manual | PUT endpoint with auth |
| Students | Profile picture upload | partial | Upload test planned |
| Students | Deactivation | manual | DELETE (soft) |
| Students | Tuition payment recording | manual | Need payment test |
| Students | Payment history display | manual | UI verification |
| Academic | Program CRUD | auto | Program tests |
| Academic | Department CRUD | auto | Department tests |
| Academic | Course management | manual | Add tests later |
| Academic | Grade recording/calc | manual | Add tests later |
| Academic | Attendance tracking | manual | Add tests later |
| Academic | Reports generation | manual | Add export tests |
| Financial | Transaction recording | manual | Accounting service tests TODO |
| Financial | Categories mgmt | manual | Pending endpoints review |
| Financial | Payment plan creation | manual | TODO test plan |
| Financial | Tuition plan installments | manual | TODO test plan |
| Financial | Financial reports | manual | Export tests TBD |
| Financial | Balance sheet | manual | Accounting logic test |
| Financial | OHADA compliance | manual | Domain verification |
| HR | Staff registration | manual | Users route test pending |
| HR | Teaching session recording | manual | Teaching sessions route |
| HR | Payroll calculation | manual | Payroll route tests pending |
| HR | Staff directory mgmt | manual | Users list test pending |
| HR | Role & permission assignment | manual | Auth mocking needed |
| Branch | Branch creation w/ manager | manual | Missing manager requirement in tests |
| Branch | Multi-branch filtering | manual | Role-based query test |
| Branch | Branch-specific access | manual | RBAC + branch test |
| Branch | Cross-branch reporting | manual | SuperAdmin scenario |
| Comm | Announcement creation | manual | Communication route test pending |
| Comm | Bulk messaging | manual | Pending implementation |
| Comm | Email notifications | manual | SMTP dependency |
| Comm | SMS integration | manual | External provider |
| Reporting | Financial exports | manual | Validate CSV/PDF generation |
| Reporting | Academic exports | manual | Students export test partial |
| Reporting | Audit trail reports | manual | Event logs review |
| Admin | User creation roles | manual | Users route test needed |
| Admin | Permission matrix | manual | RBAC test suite |
| Admin | User deactivate/reactivate | manual | Soft delete test |
| Admin | Password reset admin | manual | Auth route test |
| Backup | System backup creation | manual | Backup route test pending |
| Backup | Restore works | manual | Backup restore manual test |
| Settings | Config changes persist | manual | Settings route not covered |
| Settings | Academic year transitions | manual | Domain logic |
| Quality | No console errors | manual | Browser devtools |
| Quality | No TS compile errors | partial | tsc run in CI desirable |
| Quality | API documented | manual | Generate OpenAPI? |
| Quality | Code comments present | manual | Review |
| Quality | Unused code removed | manual | ESLint + review |
| Docs | User manual | manual | Provide PDF/guide |
| Docs | API documentation | manual | Pending generation |
| Docs | Install guide | manual | README + env sample |
| Docs | Troubleshooting guide | manual | Add section |
| Docs | Admin setup instructions | manual | Add section |
| Deployment | Production config | manual | Render / Docker docs |
| Deployment | DB seeded | manual | Seed script check |
| Deployment | Default admin created | auto | SuperAdmin seeding on startup |
| Deployment | Monitoring/logging | manual | Infra setup |
| Delivery | Demo data populated | manual | Optional script |
| Delivery | Training material | manual | Provide separately |
| Delivery | Support contacts | manual | Provide list |

> Continue expanding automated coverage; update this table when new tests are added.
