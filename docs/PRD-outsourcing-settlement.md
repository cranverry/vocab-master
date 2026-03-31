# PRD: EDEN-SPECTRUM 아웃소싱 자동정산 시스템

**문서 ID**: PRD-settlement-v2  
**작성일**: 2026-03-31  
**최종 수정**: 2026-03-31 (v2)  
**작성자**: Milo (CPO 지시)  
**상태**: Draft  
**대상 시스템**: eden-hub (Vercel + Notion)

---

## 1. 배경 & 문제 정의

### 1.1 현황 (As-Is)

EDEN-SPECTRUM의 외주 정산은 현재 Google Sheets("[CR] 아웃소싱 정산")로 수동 관리 중.

**정산 시트 3-레이어 구조:**
| 시트 | 역할 |
|---|---|
| 계약 단가표 | 작가별 기본단가 / 수정단가 / 계약 만료일 / 법적 서류 |
| 월별 요약 | 월 × 과목별 총액 KPI |
| YYYY_MM_정산 | 작업 건별 상세 내역 + 작가별 총액 + 입금 상태 |

**과업지시서 현황**: Notion 별도 기획DB에서 수동 생성 후 수동 전달 중. 작업 요청-승인-완료 흐름이 기획DB, ClickUp, 정산 시트 3곳에 분산되어 있음.

### 1.2 문제 (Pain Points)

| # | 문제 | 영향 |
|---|---|---|
| P1 | 작업 완료 후 정산 시트 수동 기입 → 누락·지연 빈발 | 정산 오류, 작가 불만 |
| P2 | 단가가 유동적인데 단일 소스 없음 → 수동 조회 시 오기입 | 이번 달 김지영 차액 발생 사례 |
| P3 | 과업지시서 수동 생성·수동 전달 | 관리 공수, 누락 리스크 |
| P4 | 티켓 DB(칸반/타임라인)와 상품기획 DB가 분리 | 맥락 전환 비용, 데이터 이중화 |
| P5 | 섬네일·대응리깅은 ClickUp 티켓 없이 진행 | 정산 시 수동 티켓 생성 소요 |
| P6 | 계약 만료 자동 감지 없음 | 만료 후 작업 진행 케이스 발생 |
| P7 | 입금 확인 수동 체크 | 입금 누락 리스크 |

### 1.3 핵심 질문: 자동화 정산을 신뢰할 수 있는가?

> "결국 마지막에 내가 대조하면서 맞는지 확인해야 하는 소요가 생기는 것 아닌가?"

**답변**: 신뢰 가능하다 — 단, 조건이 있다.

자동화 정산의 신뢰성은 **입력 데이터 품질**에 달려 있다. 단가가 Task에 정확히 기록되어 있고, 건수·완료일이 정확하다면 계산 오류는 없다. 현재 오류(김지영 사례)는 자동화 부재 때문이지, 자동화가 만들어낸 오류가 아니다.

다만 완전한 무검수는 불가능하다. 목표는 **CPO의 검수 소요를 최소화**하는 것:
- 이상값 자동 플래그 (전월 대비 ±30% 이상 → 노란 경고)
- 단가 스냅샷 잠금 (입력 후 변경 불가)
- 검수 대상을 전체 → 이상값·신규 작가만으로 축소

### 1.4 목표 (To-Be)

과업지시서 생성 → 작업 진행 → 완료 처리 → 정산 자동 생성 → 간편 검수 → 입금 처리까지 Eden Hub 단일 인터페이스에서 관리.

---

## 2. 스코프

### 2.1 In Scope (Phase 1)

- **Eden Hub 과업지시서 통합**: 기획DB 기반 과업지시서 생성 + 티켓 연결 (ClickUp 접근성 문제 해결)
- **섬네일·대응리깅 티켓 자동 생성**: 기획DB에서 작업 배정 시 해당 타입 티켓 자동 생성
- **Eden Hub 완료 처리 → 정산 자동 생성**: 티켓 완료 상태 → Settlement 생성
- **유동 단가 관리**: Task 단가 필드 (합의 시점 고정), 브랜드별 참고 단가 분리
- **정산 대시보드**: 이상값 자동 플래그 포함
- **입금 상태 관리**: 미정산 → 검수 → 입금완료
- **계약 만료 알림** (Discord)
- **월별 요약 자동 집계**

### 2.2 Out of Scope (전 Phase)

- 세금계산서 / 원천징수 자동 발행
- 은행 API 연동 실입금 확인
- 작가용 외부 포털

### 2.3 Phase 2 이후

- ClickUp 완전 제거 (Eden Hub 티켓으로 100% 마이그레이션)
- Supabase 마이그레이션 (집계 성능 개선)

---

## 3. 사용자 & 역할

| 역할 | 주체 | 주요 행동 |
|---|---|---|
| CPO (관리자) | Damon | 이상값 최종 확인, 입금 처리, 정책 결정 |
| 운영 담당 | 남태경 | 과업지시서 생성, 정산 내역 검수, 작가 커뮤니케이션 |

---

## 4. 티켓·기획DB 통합 설계

### 4.1 현재 구조의 문제

```
[현재]
기획DB (Notion) ─── 수동 ───→ 과업지시서 PDF/메시지 ─── 수동 ───→ 작가
ClickUp 티켓 ─── 별도 생성 ───→ 타임라인/칸반 관리
정산 시트 ─── 수동 기입 ───→ 입금 처리
```

세 시스템이 분리되어 있어 데이터 이중화 + 맥락 전환 비용 발생.  
특히 섬네일·대응리깅은 ClickUp 티켓 자체가 없어 정산 시 수동 생성 필요.

### 4.2 목표 구조

```
[Eden Hub]
상품기획 DB (아이템 단위) ─── 배정 클릭 ───→ 과업지시서 자동 생성 + Discord 전달
         ↓ 연결
공정 티켓 DB (작업 단위, 칸반/타임라인)
         ↓ 완료 처리
정산 자동 생성 ─── 이상값 플래그 ───→ 간편 검수 ───→ 입금 처리
```

### 4.3 핵심 연결 원칙

- **1 아이템 = N 공정 티켓** (원화 1 + 모델링 1 + 리깅 1 + 섬네일 1)
- 티켓 생성 시 단가 필드 필수 입력 (Required) — 빈값이면 배정 불가
- 섬네일·대응리깅도 동일 티켓 시스템으로 통합 (별도 예외 없음)

---

## 5. 유동 단가 처리 설계

### 5.1 문제

기존 계약 단가표는 작가별 고정 단가 가정. 실제로는 프로젝트·브랜드별 유동 단가로 운영 중.  
→ 수동 조회 시 혼동 → 이번 달 차액 발생.

### 5.2 해결: 단가 이원화

| 레이어 | 저장 위치 | 용도 |
|---|---|---|
| **참고 단가** | Contract DB (브랜드별) | 협의 가이드라인, 이상값 감지 기준 |
| **확정 단가** | Task 단가 필드 (필수) | 실제 정산 계산 소스 |

단가 흐름:
```
협의 완료 → 운영 담당이 Task 단가 필드 입력 (작가와 합의한 값)
                          ↓
              완료 처리 시 스냅샷 고정 (이후 변경 불가)
                          ↓
              정산 생성: Settlement.unitPrice = Task.단가
```

### 5.3 이상값 자동 감지

```
Settlement 생성 시:
  if |Task.단가 - Contract.참고단가[brand]| / 참고단가 > 30%
    → 경고 배지 표시
    → Discord: "⚠️ [김지영 BTQ] 입력단가 850,000 / 참고단가 500,000 (+70%)"
    → CPO 확인 요청
```

---

## 6. 데이터 모델

### 6.1 Contract (계약 + 참고 단가)

```
Contract {
  id              string
  artistName      string
  workType        WorkType         // 원화 | 모델링 | 리깅 | 섬네일
  referenceRates  map<BrandKey, number>  // 브랜드별 참고 단가
  revisionRate    number           // 수정 단가 (원/회)
  expiresAt       date | null
  status          ContractStatus   // 계약중 | 계약종료 | 재계약필요
  idDocPath       string
  bankDocPath     string
}

WorkType       = '원화' | '모델링' | '리깅' | '섬네일'
ContractStatus = '계약중' | '계약종료' | '재계약필요'
BrandKey       = 'oasis' | 'serina' | 'mirage' | 'yumeya' | 'nua'
```

### 6.2 WorkTicket (공정 티켓)

```
WorkTicket {
  id              string
  itemId          string           // → 상품기획 DB 아이템
  artistName      string
  workType        WorkType
  brandKey        BrandKey
  agreedPrice     number           // 합의 단가 (Required — 빈값 배정 불가)
  quantity        number           // 건수
  revisionCount   number           // 초과 수정 횟수
  startDate       date
  dueDate         date
  completedAt     date | null
  status          TicketStatus     // 배정 | 진행중 | 완료 | 취소
  settlementId    string | null    // 생성된 정산 ID 역링크
}
```

### 6.3 Settlement (정산 항목)

```
Settlement {
  id              string
  month           string           // YYYY-MM
  ticketId        string           // → WorkTicket.id
  artistName      string
  workType        WorkType
  brandKey        BrandKey
  unitPrice       number           // 스냅샷 고정 (Task.agreedPrice)
  referencePrice  number           // 스냅샷 고정 (Contract.referenceRates[brand])
  priceVariance   number           // |(unitPrice - referencePrice) / referencePrice|
  quantity        number
  revisionFee     number
  totalAmount     number
  completedAt     date
  status          SettlementStatus // 자동생성 | 검수완료 | 입금완료 | 보류
  isAnomalous     boolean          // variance > 30%
  paidAt          datetime | null
  note            string
}
```

---

## 7. 핵심 플로우

### 7.1 과업지시서 생성 (신규)

```
Eden Hub 상품기획 DB
  → [배정] 클릭 → 작가 선택 → 단가 입력 (빈값 불가)
  → WorkTicket 자동 생성
  → 과업지시서 Discord DM 자동 전달 (또는 코워크 채널)
```

### 7.2 정산 자동 생성

```
WorkTicket 완료 처리
  → Settlement 생성
  → priceVariance 계산 → 30% 초과 시 isAnomalous = true + Discord 경고
  → status = "자동생성"
```

### 7.3 검수 & 입금

```
정산 대시보드
  → 이상값(isAnomalous) 항목 상단 노출 + 경고 배지
  → 정상 항목: [검수완료] 일괄 처리 가능
  → 이상값 항목: 개별 확인 후 [검수완료] 또는 [보류]
  → [입금처리] → paidAt 기록 → Discord 알림
```

---

## 8. UI 설계

### 8.1 Eden Hub SPECTRUM 탭 구조

```
EDEN-SPECTRUM
  ├── 간트 차트 (기존)
  ├── 상품기획 (기획DB + 배정 UI — 신규)
  ├── 공정 티켓 (칸반/타임라인 — 기획DB 연결)
  └── 정산 (신규)
```

### 8.2 상품기획 탭 — 과업지시서 배정 UI

```
아이템 목록
  각 행: 아이템명 | 브랜드 | 공정별 배정 현황 (원화/모델링/리깅/섬네일)

[배정] 버튼 클릭 → 슬라이드오버
  작가 선택 | 합의 단가 (필수) | 건수 | 마감일
  → [배정 확정] → Ticket 생성 + Discord 전달
```

### 8.3 정산 탭

```
상단 KPI: [이번달 총액] [입금완료] [검수대기] [⚠️ 이상값]

필터: [월] [과목] [상태] [작가]

정산 테이블:
  ⚠️ 이상값 항목 최상단 강조
  작가명 | 과목 | 작업내용 | 합의단가 | 참고단가 | 건수 | 합계 | 상태 | 액션

[정상 항목 일괄 검수완료] 버튼 (이상값 제외)
```

---

## 9. 알림 설계

| 이벤트 | 채널 | 내용 |
|---|---|---|
| 과업지시서 전달 | 코워크 채널 | 작업명 / 단가 / 마감일 / 요청 내용 |
| 정산 자동 생성 | #platform-board | `[WorkType] 작가명 — 작업명 (금액원) → 검수 필요` |
| 이상값 감지 | #platform-board | `⚠️ [작가명] 입력단가 XX만원 / 참고단가 YY만원 (+Z%)` |
| 계약 만료 D-30 | #secretary | `⚠️ [작가명] 계약 만료 예정 (D-30)` |
| 입금 완료 | #platform-board | `💸 [작가명] [금액]원 입금완료` |
| 월별 취합 완료 | #secretary | 월간 정산 요약 |

---

## 10. Phase 계획

### Phase 1 (MVP) — 4~6주

| 항목 | 세부 |
|---|---|
| 과업지시서 배정 UI | 상품기획 탭, WorkTicket 생성, Discord 전달 |
| 섬네일·대응리깅 티켓 통합 | 기획DB 배정 → 자동 티켓 생성 |
| 정산 자동 생성 | 티켓 완료 → Settlement 생성 |
| 유동 단가 처리 | Task 단가 필드 (필수) + 이상값 감지 |
| 정산 대시보드 | 이상값 상단 노출, 일괄 검수 |
| 알림 | Discord 과업지시서 전달 + 이상값 경고 |

### Phase 1.5 — 2주

| 항목 | 세부 |
|---|---|
| 월별 요약 자동 집계 | cron + Google Sheets 동기화 |
| 계약 만료 알림 | 매일 체크 |
| 수동 보정 UI | 오기입 수정 인터페이스 |

### Phase 2 — 별도 PRD

| 항목 | 세부 |
|---|---|
| ClickUp 완전 제거 | Eden Hub 티켓 100% 마이그레이션 |
| Supabase 마이그레이션 | 집계 성능 개선 |

---

## 11. 미결 사항

| # | 질문 | 현재 방향 |
|---|---|---|
| Q1 | 스토리지: Notion 단독 vs Supabase? | Notion 권장 (Phase 1 일관성) |
| Q2 | 계약 만료 작가 작업: 차단 vs 경고? | 경고 후 진행 허용 |
| Q3 | 과업지시서 Discord 전달: DM vs 코워크 채널? | 코워크 채널 권장 |
| Q4 | 이상값 기준 30%: 조정 가능? | 운영 담당(남태경) 판단 후 설정 |
| Q5 | 월별 귀속 기준: 완료일 vs 수동 지정? | 완료일 기준 권장 |

---

## 12. 선행 작업 (구현 전 필요)

1. **Eden Hub 상품기획 DB 스키마 정의** — 아이템 단위 필드 구조 확정
2. **Contract 참고 단가 입력** — 브랜드별 단가 분리 기입 (이상값 감지 기준)
3. **섬네일·대응리깅 배정 프로세스 확정** — 티켓 단위 정의 (건수 기준)
4. **Discord 과업지시서 템플릿 확정** — 운영 담당(남태경) 검토
5. **Notion DB 생성** — settlements, contracts, work-tickets DB (SPECTRUM 하위)

---

## 13. 비기능 요구사항

| 항목 | 요구사항 |
|---|---|
| 단가 잠금 | 티켓 완료 처리 시 단가 스냅샷 고정 — 이후 변경 시 감사 로그 |
| 중복 방지 | 동일 Ticket ID로 Settlement 중복 생성 불가 |
| 감사 로그 | 모든 상태 변경 이력 보존 (누가, 언제, 무엇을) |
| 이상값 임계치 | 기본 30%, 운영 설정으로 조정 가능 |
| 오류 격리 | 처리 실패 시 Discord 에러 알림 + 재시도 |

---

*[END OF DOCUMENT — v2]*
