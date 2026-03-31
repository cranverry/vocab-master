# PRD: EDEN-SPECTRUM 아웃소싱 자동정산 시스템

**문서 ID**: PRD-settlement-v1  
**작성일**: 2026-03-31  
**작성자**: Milo (CPO 지시)  
**상태**: Draft  
**대상 시스템**: eden-hub (Vercel + Notion + ClickUp)

---

## 1. 배경 & 문제 정의

### 1.1 현황 (As-Is)

EDEN-SPECTRUM의 외주 정산은 현재 Google Sheets("[CR] 아웃소싱 정산")로 수동 관리 중.

**3-레이어 구조:**
| 시트 | 역할 |
|---|---|
| 계약 단가표 | 작가별 기본단가 / 수정단가 / 계약 만료일 / 법적 서류 |
| 월별 요약 | 월 × 과목별 총액 KPI |
| YYYY_MM_정산 | 작업 건별 상세 내역 + 작가별 총액 + 입금 상태 |

**컨벤션**: 매 월 마지막 주 월요일에 완료 내역 최종 취합 + 작가 검수.

### 1.2 문제 (Pain Points)

| # | 문제 | 영향 |
|---|---|---|
| P1 | 작업 완료 후 시트에 수동 기입 → 누락, 지연 빈발 | 정산 오류, 작가 불만 |
| P2 | ClickUp 완료 상태와 정산 시트가 비동기 | 매월 수동 대조 필요 |
| P3 | 단가표와 정산표 연동 없음 → 금액 계산 수동 | 단가 오기입 리스크 |
| P4 | 계약 만료 작가 자동 감지 없음 | 만료 후 작업 진행 케이스 발생 |
| P5 | 입금 확인/미확인 수동 체크 | 입금 누락 리스크 |
| P6 | 월별 요약 수동 취합 | 매월 반복 공수 |

### 1.3 목표 (To-Be)

ClickUp 티켓 **완료** 상태 변경 → 정산 항목 자동 생성 → 작가 검수 → 입금 처리 순서로 이어지는 파이프라인 자동화.

---

## 2. 스코프

### 2.1 In Scope (Phase 1)

- ClickUp 완료 상태 웹훅 수신 → 정산 항목 자동 생성
- 계약 단가표 기반 자동 금액 계산 (기본단가 × 건수 + 초과수정비)
- 월별 정산 대시보드 (작가별 / 과목별 / 상태별)
- 입금 상태 관리 (미정산 → 검수 → 입금완료)
- 계약 만료 알림 (Discord)
- 월별 요약 자동 집계

### 2.2 Out of Scope (Phase 1)

- 세금계산서 / 원천징수 자동 발행
- 은행 API 연동 실입금 확인
- 작가용 외부 포털 (내 정산 조회)
- Eden Hub 자체 티켓으로 마이그레이션 (Phase 2)

---

## 3. 사용자 & 역할

| 역할 | 주체 | 주요 행동 |
|---|---|---|
| CPO (관리자) | Damon | 정산 최종 확인, 입금 처리, 이슈 해결 |
| 운영 담당 | 임상현 | 정산 내역 검수, 작가 커뮤니케이션 |
| 작가 | 외주 작가 | (Phase 2) 내 정산 조회 |

---

## 4. 데이터 모델

### 4.1 Contract (계약 단가표)

```
Contract {
  id              string        // 내부 UUID
  artistName      string        // 작가명
  workType        WorkType      // 원화 | 모델링 | 리깅 | 섬네일
  baseRate        number        // 기본 단가 (원)
  revisionRate    number        // 수정 단가 (원/회)
  note            string        // 비고 (브랜드 기준 등)
  expiresAt       date | null   // 계약 만료일 (없으면 단건 계약)
  status          ContractStatus // 계약중 | 계약종료 | 재계약필요
  idDocPath       string        // 신분증 사본 파일 경로
  bankDocPath     string        // 통장 사본 파일 경로
  clickupUserId   string        // ClickUp User ID (매핑용)
  createdAt       datetime
  updatedAt       datetime
}

WorkType    = '원화' | '모델링' | '리깅' | '섬네일'
ContractStatus = '계약중' | '계약종료' | '재계약필요'
```

### 4.2 Settlement (정산 항목)

```
Settlement {
  id              string        // 내부 UUID
  month           string        // YYYY-MM (정산 귀속 월)
  contractId      string        // → Contract.id
  artistName      string        // 비정규화 캐시 (검수용)
  workType        WorkType
  clickupTaskId   string        // 출처 ClickUp Task ID
  taskTitle       string        // 작업 내용
  brandKey        string        // oasis | serina | mirage | yumeya | nua
  unitPrice       number        // 정산 시점 단가 스냅샷
  quantity        number        // 건수
  revisionCount   number        // 초과 수정 횟수 (3회 초과분)
  revisionFee     number        // 초과 수정비 (계산값)
  totalAmount     number        // unitPrice × quantity + revisionFee
  startDate       date          // 착수일
  dueDate         date          // 예정 완료일
  completedAt     date | null   // 실제 완료일
  status          SettlementStatus
  paidAt          datetime | null
  note            string
  createdAt       datetime
  updatedAt       datetime
}

SettlementStatus = '자동생성' | '검수대기' | '검수완료' | '입금완료' | '보류'
```

### 4.3 MonthlyReport (월별 요약 — 집계)

```
MonthlyReport {
  month           string        // YYYY-MM
  artworkTotal    number
  modelingTotal   number
  riggingTotal    number
  thumbnailTotal  number
  grandTotal      number
  paidTotal       number
  pendingTotal    number
  lastCompiledAt  datetime
}
```

### 4.4 ClickUp → WorkType 매핑

ClickUp 티켓의 **List 이름** 또는 **Custom Field**로 WorkType 판별.

| ClickUp 식별자 | WorkType |
|---|---|
| List: `원화` 포함 | 원화 |
| List: `모델링` 포함 | 모델링 |
| List: `리깅` 포함 | 리깅 |
| List: `섬네일` 포함 | 섬네일 |
| Custom Field: `작업유형` | 직접 매핑 |

> **Phase 2**: Eden Hub 자체 Phases DB의 `type` 필드로 대체.

---

## 5. 핵심 플로우

### 5.1 자동 정산 생성 플로우

```
ClickUp Task → 상태: "완료"
       ↓
[Webhook] POST /api/settlement/clickup-webhook
       ↓
① Task 검증
  - 대상 WorkType 해당 여부 확인
  - 담당자(Assignee) → Contract 조회
  - 계약 만료 여부 체크 → 만료 시 Discord 경고
       ↓
② Settlement 생성
  - unitPrice = Contract.baseRate 스냅샷
  - quantity = Task Custom Field "건수" (없으면 1)
  - revisionCount = Task Custom Field "수정횟수" - 3 (음수면 0)
  - revisionFee = max(0, revisionCount) × Contract.revisionRate
  - totalAmount 계산
  - status = "자동생성"
  - month = completedAt 기준 YYYY-MM
       ↓
③ Discord 알림 → #platform-board
  "✅ [원화] 심서진 — OAS 2Q-C 시안 정산 항목 생성됨 (135,000원) → 검수 필요"
       ↓
④ Notion Phases DB 업데이트 (정산ID 역링크)
```

### 5.2 정산 검수 & 입금 플로우

```
Eden Hub 정산 화면
       ↓
운영 담당 / CPO가 Settlement 목록 확인
       ↓
[검수완료] 버튼 클릭 → status: "검수대기" → "검수완료"
       ↓
[입금처리] 버튼 클릭
  - paidAt 기록
  - status: "입금완료"
  - MonthlyReport 집계 업데이트
       ↓
Discord 알림: "💸 [모델링] 황예원 850,000원 입금완료"
```

### 5.3 월별 요약 자동 집계

```
트리거: 매 월 마지막 주 월요일 00:00 KST (cron)
       ↓
해당 월 전체 Settlement 집계
→ MonthlyReport upsert
→ Google Sheets 월별 요약 시트 자동 업데이트 (Phase 1.5)
→ Discord #secretary 채널에 월간 정산 요약 발송
```

---

## 6. API 설계

### 6.1 Webhook

```
POST /api/settlement/clickup-webhook
  Header: X-Signature: <HMAC-SHA256>
  Body:   ClickUp webhook payload (task.status.changed)

Response:
  200 { ok: true, settlementId }
  400 { ok: false, error: "not a settlement-eligible task" }
  409 { ok: false, error: "duplicate: already settled" }
```

### 6.2 정산 목록 조회

```
GET /api/settlement?month=2026-03&status=검수대기&workType=원화
  Auth: JWT (requireAuth)

Response:
  200 {
    ok: true,
    settlements: Settlement[],
    summary: { total, paid, pending }
  }
```

### 6.3 정산 상태 변경

```
PATCH /api/settlement/:id
  Auth: JWT (requireAuth)
  Body: { status: "검수완료" | "입금완료" | "보류", note?: string }

Response:
  200 { ok: true, settlement: Settlement }
```

### 6.4 계약 단가표 조회 / 관리

```
GET  /api/contracts?workType=모델링&status=계약중
POST /api/contracts          (신규 계약 등록)
PATCH /api/contracts/:id     (단가/만료일 갱신)
```

### 6.5 월별 요약

```
GET /api/settlement/monthly-report?from=2025-10&to=2026-03
  Response: MonthlyReport[]
```

---

## 7. 스토리지 전략

### Option A — Notion DB (권장, Phase 1)
기존 eden-hub가 Notion을 메인 스토어로 사용 중. SPECTRUM 하위에 두 개 DB 추가:

| DB | 역할 |
|---|---|
| `settlements` | Settlement 레코드 |
| `contracts` | Contract 레코드 |

**장점**: 별도 인프라 없음, Notion UI로 수동 보정 가능  
**단점**: 복잡한 집계 쿼리 불가 (MonthlyReport는 에이전트 집계 후 별도 저장)

### Option B — Supabase (확장성)
주문(orders) 데이터와 동일 Supabase 인스턴스에 테이블 추가.  
Phase 1.5에서 Notion → Supabase 마이그레이션 고려.

> **결정 필요**: Notion 단독 vs Supabase 병행. 현재 아키텍처 일관성 고려 시 Notion 우선 권장.

---

## 8. ClickUp 연동 상세

### 8.1 웹훅 설정

```
ClickUp Workspace Webhook:
  events: ["taskStatusUpdated"]
  endpoint: https://eden-hub.vercel.app/api/settlement/clickup-webhook
  secret: CLICKUP_WEBHOOK_SECRET (env)
```

### 8.2 정산 대상 Task 판별 조건

1. List가 정산 대상 WorkType에 해당하는 공간에 있을 것
2. 새 status가 "완료" (또는 설정된 완료 상태명)일 것
3. Assignee가 Contract에 등록된 작가일 것 (clickupUserId 매핑)
4. 이미 동일 Task로 생성된 Settlement가 없을 것 (중복 방지)

### 8.3 필요한 ClickUp Custom Fields (작가 티켓에 추가)

| 필드명 | 타입 | 용도 |
|---|---|---|
| `건수` | Number | 건수 (기본값 1) |
| `수정횟수` | Number | 실제 수정 요청 횟수 (3회 초과분 계산) |
| `브랜드` | Dropdown | oasis / serina / mirage / yumeya / nua |
| `착수일` | Date | 착수일 |

> 없는 경우 기본값 적용 (건수=1, 수정횟수=0).

---

## 9. UI 설계

### 9.1 진입점

Eden Hub 제품 선택 → `EDEN-SPECTRUM` → 하위 탭: `정산`

### 9.2 정산 대시보드 (메인)

```
상단 KPI 카드:
  [이번 달 총액]  [입금완료]  [검수대기]  [보류]

필터 바:
  [월 선택 드롭다운]  [과목 필터]  [상태 필터]  [작가 검색]

정산 테이블:
  작가명 | 과목 | 작업 내용 | 브랜드 | 단가 | 건수 | 수정비 | 합계 | 상태 | 액션

  상태 배지:
    🟡 자동생성  →  🔵 검수대기  →  🟢 검수완료  →  ✅ 입금완료  |  ⏸ 보류

  액션 버튼:
    [검수완료]  [입금처리]  [보류]  [수동수정]
```

### 9.3 계약 단가표 관리 탭

```
작가 목록 (과목별 그룹)
  각 행: 작가명 | 과목 | 기본단가 | 수정단가 | 만료일 | 상태 | [수정]

  ⚠️ 재계약 필요 작가 상단 노출 (빨간 배지)
  ⚠️ 계약 만료 D-30 이내 → 주황 경고
```

### 9.4 월별 요약 차트 탭

```
라인/바 차트: 2025-10 ~ 현재, 과목별 스택
테이블: 월 | 원화 | 모델링 | 리깅 | 섬네일 | 합계
```

---

## 10. 알림 설계

| 이벤트 | 채널 | 내용 |
|---|---|---|
| 정산 항목 자동 생성 | #platform-board | `[WorkType] 작가명 — 작업명 (금액원) → 검수 필요` |
| 계약 만료 D-30 | #secretary | `⚠️ [작가명] 계약 만료 예정 (D-30): 재계약 필요` |
| 계약 만료 D-0 | #secretary | `🚨 [작가명] 계약 만료됨: 즉시 재계약 필요` |
| 입금 완료 | #platform-board | `💸 [작가명] [금액]원 입금완료` |
| 월별 정산 취합 완료 | #secretary | 월간 정산 요약 리포트 |

---

## 11. Phase 계획

### Phase 1 (MVP) — 4~6주

| 항목 | 세부 |
|---|---|
| ClickUp 웹훅 수신 | `/api/settlement/clickup-webhook` |
| 자동 정산 생성 | 단가표 조회 → Settlement Notion DB 기록 |
| 정산 대시보드 UI | Eden Hub에 정산 탭 추가 |
| 상태 관리 | 자동생성 → 검수완료 → 입금완료 수동 조작 |
| 계약 단가표 UI | 조회 + 수정 |
| 알림 | Discord #platform-board, #secretary |

### Phase 1.5 — 2주

| 항목 | 세부 |
|---|---|
| 월별 요약 자동 집계 | cron + Google Sheets 동기화 |
| 계약 만료 알림 | 매일 cron 체크 |
| 중복/보류 처리 UI | 수동 보정 인터페이스 |

### Phase 2 — 별도 PRD

| 항목 | 세부 |
|---|---|
| Eden Hub 티켓 연동 | ClickUp 제거, Phases DB 완료 상태 기반으로 마이그레이션 |
| Supabase 마이그레이션 | Notion → Supabase (집계 성능) |
| 작가 포털 | 외부 접근 가능한 내 정산 조회 페이지 |

---

## 12. 미결 사항 (결정 필요)

| # | 질문 | 옵션 |
|---|---|---|
| Q1 | 스토리지: Notion 단독 vs Supabase 병행? | Notion 권장 (일관성), Supabase (집계 성능) |
| Q2 | 계약 만료 작가 작업 진행 시: 차단 vs 경고만? | 경고 후 진행 허용 권장 |
| Q3 | 이창민(리깅) 단가 미기재 — 단가 확정 후 소급 적용? | 별도 확인 필요 |
| Q4 | 원화 작가들 단가 일괄 미기재 — 입력 선행 필요 | 시스템 구축 전 선행 작업 |
| Q5 | ClickUp 완료 상태명 정확히 무엇? (한글/영문) | ClickUp 설정 확인 필요 |
| Q6 | 월별 귀속 기준: 완료일 vs 정산월 수동 지정? | 완료일 기준 YYYY-MM 권장 |

---

## 13. 선행 작업 (구현 전 필요)

1. **계약 단가표 정비** — 원화 작가 (심서진, 전유라, 채지원, 권도윤 등) 기본단가 입력
2. **이창민 단가 확정** — 400,000원 근거 공식화
3. **ClickUp Custom Field 추가** — 건수, 수정횟수, 브랜드, 착수일
4. **ClickUp ↔ Contract 매핑** — 각 작가의 ClickUp User ID 수집
5. **Notion DB 생성** — settlements, contracts DB (SPECTRUM 하위)
6. **웹훅 Secret 발급** — ClickUp 웹훅 설정 + CLICKUP_WEBHOOK_SECRET env 등록

---

## 14. 비기능 요구사항

| 항목 | 요구사항 |
|---|---|
| 중복 방지 | 동일 ClickUp Task ID로 Settlement 중복 생성 불가 (idempotency key) |
| 웹훅 보안 | HMAC-SHA256 서명 검증 필수 |
| 감사 로그 | 상태 변경 이력 보존 (누가, 언제, 어떤 값으로 변경했는지) |
| 단가 스냅샷 | 정산 생성 시점 단가 고정 (사후 단가표 변경 불소급) |
| 오류 격리 | 웹훅 처리 실패 시 Discord 에러 알림 + 재처리 대기열 |

---

*[END OF DOCUMENT]*
