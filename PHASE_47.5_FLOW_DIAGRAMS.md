# Phase 47.5: Demo System Flow Diagram

## Complete Demo User Experience Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEMO USER LOGIN                             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  User enters credentials  │
                   │  email: demo@example.com  │
                   └───────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │   AuthProvider.login()    │
                   │   Calls API: /api/auth    │
                   └───────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  Check: user.is_demo?     │
                   └───────────────────────────┘
                          │              │
                    YES   │              │  NO
                          ▼              ▼
          ┌──────────────────────┐   ┌──────────────┐
          │ initializeDemoUser() │   │ Regular User │
          └──────────────────────┘   │   No Banner  │
                      │               └──────────────┘
                      ▼
          ┌──────────────────────┐
          │  Check current       │
          │  scenario via API    │
          │  /api/demo-data/     │
          │  current             │
          └──────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
     YES  │                       │  NO
          ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐
│ Scenario exists     │  │ No scenario         │
│ Skip initialization │  │ Initialize now      │
└─────────────────────┘  └─────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  POST /api/demo-         │
                   │  scenarios/1/activate    │
                   │  (Scenario 1: Excelente) │
                   └───────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  POST /api/demo-data/    │
                   │  load-scenario           │
                   │  { scenario_id: 1 }      │
                   └───────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DEMOBANNER LOADS                            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  Check: user.is_demo?     │
                   └───────────────────────────┘
                          │              │
                    YES   │              │  NO
                          ▼              ▼
          ┌──────────────────────┐   ┌──────────────┐
          │ Load current         │   │ Return null  │
          │ scenario from API    │   │ (hide banner)│
          └──────────────────────┘   └──────────────┘
                      │
                      ▼
          ┌──────────────────────┐
          │  Scenario data       │
          │  received?           │
          └──────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
     YES  │                       │  NO
          ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐
│ Display Banner      │  │ Retry (max 3x)      │
│ with 3-position     │  │ Wait 1 second       │
│ switch              │  │ Then try again      │
└─────────────────────┘  └─────────────────────┘
          │                       │
          │                       │ After 3 retries
          │                       ▼
          │              ┌─────────────────────┐
          │              │ Still no data?      │
          │              │ Return null         │
          │              │ (initialization     │
          │              │  still pending)     │
          │              └─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BANNER DISPLAYED                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🎓 Modo Demostración • ✅ Negocio Excelente                   │  │
│  │                                                                │  │
│  │  [ ✅ ]  [ ⚖️ ]  [ ⚠️ ]  [⚙️]  [✕]                            │  │
│  │  Active  Regular Problems Demo Close                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ User clicks scenario 2
                                   ▼
                   ┌───────────────────────────┐
                   │  handleScenarioSwitch(2)  │
                   └───────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  POST /api/demo-         │
                   │  scenarios/2/activate    │
                   └───────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  POST /api/demo-data/    │
                   │  load-scenario           │
                   │  { scenario_id: 2 }      │
                   └───────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────┐
                   │  window.location.reload() │
                   └───────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BANNER UPDATED                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🎓 Modo Demostración • ⚖️ Negocio Regular                     │  │
│  │                                                                │  │
│  │  [ ✅ ]  [ ⚖️ ]  [ ⚠️ ]  [⚙️]  [✕]                            │  │
│  │  Excellent Active Problems Demo Close                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Database State Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE STATE                              │
└─────────────────────────────────────────────────────────────────────┘

BEFORE MIGRATION 049:
┌──────────────────────────────────────────────────────┐
│ users table                                          │
├──────────────────────────────────────────────────────┤
│ id          │ email            │ is_demo │ scenario │
│ demo_001    │ demo@example.com │    1    │   NULL   │ ❌ Problem!
└──────────────────────────────────────────────────────┘

AFTER MIGRATION 049:
┌──────────────────────────────────────────────────────┐
│ users table                                          │
├──────────────────────────────────────────────────────┤
│ id          │ email            │ is_demo │ scenario │
│ demo_001    │ demo@example.com │    1    │    1     │ ✅ Fixed!
└──────────────────────────────────────────────────────┘

DEMO SCENARIOS:
┌────────────────────────────────────────────────────────────────┐
│ demo_scenarios table                                           │
├────────────────────────────────────────────────────────────────┤
│ id │ scenario_name        │ type      │ monthly_revenue       │
│ 1  │ Negocio Excelente    │ excellent │ +$120,000 MXN        │
│ 2  │ Negocio Regular      │ regular   │ +$45,000 MXN         │
│ 3  │ Negocio en Problemas │ struggling│ +$25,000 MXN         │
└────────────────────────────────────────────────────────────────┘
```

## Component Communication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT TREE                             │
└─────────────────────────────────────────────────────────────────────┘

                        App.jsx
                           │
                           ▼
                    ┌──────────────┐
                    │ AuthProvider │
                    │              │
                    │ State:       │
                    │ - user       │
                    │ - loading    │
                    │              │
                    │ Methods:     │
                    │ - login()    │
                    │ - checkAuth()│
                    │ - initialize │
                    │   DemoUser() │
                    └──────────────┘
                           │
                           │ Context provides user data
                           ▼
                ┌──────────────────────┐
                │ AuthenticatedApp     │
                │                      │
                │ Contains:            │
                │ - NavigationBar      │
                │ - DemoBanner  ◄──────┼─── useAuth() hook
                │ - MainContent        │
                └──────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  DemoBanner  │
                    │              │
                    │ Props:       │
                    │ - user (from │
                    │   useAuth)   │
                    │              │
                    │ State:       │
                    │ - scenario   │
                    │ - loading    │
                    │ - switching  │
                    │ - retryCount │
                    └──────────────┘
```

## API Call Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│                      API CALL SEQUENCE                              │
└─────────────────────────────────────────────────────────────────────┘

1. Login Flow:
   ┌─────────────────────────────────────────┐
   │ POST /api/auth                          │
   │ Body: { email, password }               │
   │ Response: { token, user: {is_demo: 1} }│
   └─────────────────────────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │ GET /api/demo-data/current              │
   │ Headers: { Authorization: Bearer ... } │
   │ Response: { data: null }                │
   └─────────────────────────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │ POST /api/demo-scenarios/1/activate     │
   │ Headers: { Authorization: Bearer ... } │
   │ Response: { success: true }             │
   └─────────────────────────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │ POST /api/demo-data/load-scenario       │
   │ Body: { scenario_id: 1 }                │
   │ Response: { success: true }             │
   └─────────────────────────────────────────┘

2. Banner Load Flow:
   ┌─────────────────────────────────────────┐
   │ GET /api/demo-data/current              │
   │ Headers: { Authorization: Bearer ... } │
   │ Response: { data: {...scenario} }       │
   └─────────────────────────────────────────┘

3. Scenario Switch Flow:
   ┌─────────────────────────────────────────┐
   │ POST /api/demo-scenarios/2/activate     │
   │ Headers: { Authorization: Bearer ... } │
   │ Response: { success: true }             │
   └─────────────────────────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │ POST /api/demo-data/load-scenario       │
   │ Body: { scenario_id: 2 }                │
   │ Response: { success: true }             │
   └─────────────────────────────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────────┐
   │ window.location.reload()                │
   └─────────────────────────────────────────┘
```

## Timing Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TIMING DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────┘

Time    AuthProvider              DemoBanner              Backend
─────   ──────────────            ──────────              ───────
 0ms    login() starts
        │
100ms   │ POST /api/auth ──────────────────────────────► Auth user
        │                                                  Check demo
200ms   │ ◄───────────────────────────────────────────── Return user
        │                                                  is_demo=1
        ▼
        setUser(user)
        │
250ms   │ initializeDemoUser()
        │ GET /api/demo-data/current ──────────────────► Check scenario
300ms   │ ◄───────────────────────────────────────────── Return null
        │
        │ POST /api/demo-scenarios/1/activate ─────────► Activate
400ms   │ ◄───────────────────────────────────────────── OK
        │
        │ POST /api/demo-data/load-scenario ───────────► Load data
600ms   │ ◄───────────────────────────────────────────── OK
        ▼
        Init complete
                                  │
700ms                            ▼
                                 DemoBanner mounts
                                 useEffect runs
                                 │
750ms                            │ GET /api/demo-data/current ───► Get scenario
850ms                            │ ◄──────────────────────────── Return scenario
                                 ▼
900ms                            Display banner with scenario 1
                                 ✅ Negocio Excelente


RACE CONDITION SCENARIO (without retry):
─────────────────────────────────────────────────────────────────────
Time    AuthProvider              DemoBanner              Backend
─────   ──────────────            ──────────              ───────
 0ms    login() starts
        │
        │ (similar flow)
        │
300ms   DemoBanner mounts early!
        │                         │
        │                         ▼
        │                         GET /api/demo-data/current ───► Check
        │                         │                                (no scenario
350ms   │                         │ ◄───────────────────────────  yet!)
        │                         ▼                                Return null
        │                         Banner hidden ❌ PROBLEM!
        │
400ms   │ POST /api/demo-scenarios/1/activate ─────────► NOW activate
        │ (too late, banner                              scenario
        │  already hidden)
        ▼


WITH RETRY MECHANISM:
─────────────────────────────────────────────────────────────────────
Time    AuthProvider              DemoBanner              Backend
─────   ──────────────            ──────────              ───────
300ms   DemoBanner mounts
                                  │
                                  ▼
                                  GET /api/demo-data/current ───► Check
350ms                             │ ◄──────────────────────────── null
                                  │
                                  ▼
                                  retryCount = 1, wait 1000ms
400ms   POST /api/demo-scenarios/1/activate ─────────────► Activate
500ms                                                       Load data
                                  │
1350ms                            ▼
                                  Retry: GET /api/demo-data/current ─► Check
1400ms                            │ ◄───────────────────────────────  scenario!
                                  ▼
                                  Display banner ✅ SUCCESS!
```

## Success Criteria Checklist

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUCCESS CRITERIA                                │
└─────────────────────────────────────────────────────────────────────┘

Technical Implementation:
  ✅ Migration 049 created
  ✅ AuthProvider enhanced with initializeDemoUser()
  ✅ DemoBanner uses useAuth() hook
  ✅ Retry mechanism implemented (max 3 retries)
  ✅ Build passes without errors
  ✅ No TypeScript/ESLint warnings

User Experience:
  □ Demo user sees banner immediately after login
  □ 3-position switch visible (✅ ⚖️ ⚠️)
  □ Current scenario highlighted
  □ Clicking scenario loads new data
  □ Banner updates after scenario switch
  □ Non-demo users don't see banner

Edge Cases:
  ✅ No token → Banner returns early
  ✅ Non-demo user → Banner hidden
  ✅ API error → Graceful degradation
  ✅ Race condition → Retry mechanism
  ✅ Network failure → Error logged
  ✅ Dismissed banner → Stays hidden until reload

Performance:
  ✅ No unnecessary re-renders
  ✅ API calls minimized
  ✅ Retry delays reasonable (1 second)
  ✅ Build size not significantly increased
```

## Files Changed Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FILES CHANGED                                  │
└─────────────────────────────────────────────────────────────────────┘

NEW FILES (2):
  ✅ migrations/049_initialize_demo_users_default_scenario.sql
     - Sets current_demo_scenario_id = 1 for demo users
     - 23 lines

  ✅ PHASE_47.5_SUMMARY.md
     - Complete phase documentation
     - 300 lines

MODIFIED FILES (2):
  ✅ src/components/AuthProvider.jsx
     - Added initializeDemoUser() function (48 lines)
     - Updated login() to call initializeDemoUser()
     - Updated loginGoogle() to call initializeDemoUser()
     - Updated checkAuth() to call initializeDemoUser()
     - Total changes: +105 lines, -2 lines

  ✅ src/components/demo/DemoBanner.jsx
     - Added useAuth() hook import
     - Added retry mechanism with retryCount state
     - Enhanced loadCurrentScenario() with retry logic
     - Added user.is_demo check
     - Total changes: +34 lines, -3 lines

TOTAL IMPACT:
  - 4 files changed
  - +462 lines added (including docs)
  - -5 lines removed
  - Net: +457 lines
```
