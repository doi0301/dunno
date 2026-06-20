# DUNNO 작업 티켓 목록 (GitHub Issues 스타일)

## 공통 규칙
- 우선순위: P0 먼저 완료, 이후 P1, 마지막 P2
- 라벨 예시: `P0`, `frontend`, `storage`, `ui`, `deploy`, `enhancement`
- 완료 정의: 각 티켓의 Acceptance Criteria 전부 충족 시 Done

## 진행 상태 (2026-06-20)
- [x] T-001 프로젝트 초기 세팅
- [x] T-002 Item 모델과 상태 관리
- [x] T-003 localStorage 영속화
- [x] T-004 물건 추가 플로우
- [x] T-005 목록 렌더링과 카테고리 그룹
- [x] T-006 이미지 썸네일과 폴백
- [x] T-007 검색 및 카테고리 필터
- [x] T-008 수정 및 삭제
- [x] T-009 마이크로 인터랙션 및 스타일 완성
- [x] T-010 MVP 검증 테스트
- [x] T-011 위치별 보기 토글
- [x] T-012 온보딩 또는 샘플 데이터
- [x] T-013 수량 빠른 조절
- [ ] T-014 Azure 배포 (azd 초기화 완료, 서비스 추가 대기)

---

## T-001 프로젝트 초기 세팅
- Priority: P0
- Labels: P0, setup, frontend
- Summary: 모바일 우선 단일 웹앱 기본 구조를 만든다.
- Description:
  - index.html, style.css, app.js 생성
  - 모바일 뷰포트 및 기본 레이아웃(헤더/검색/리스트/FAB) 구성
  - 카테고리 상수(키, 이름, 이모지, 색상) 정의
- Acceptance Criteria:
  - 브라우저에서 빌드 없이 실행된다
  - 모바일 세로 레이아웃이 깨지지 않는다
  - 카테고리 상수가 중앙에서 관리된다

## T-002 Item 모델과 상태 관리
- Priority: P0
- Labels: P0, data, storage
- Summary: Item 데이터 모델과 앱 상태 구조를 정의한다.
- Description:
  - 필드: id, name, location, category, quantity, memo, imageUrl, createdAt
  - 상태 구조: items, searchQuery, activeCategory
  - 기본값 및 데이터 정규화 함수 작성
- Acceptance Criteria:
  - 아이템 생성/수정 시 필드 누락 없이 일관된 구조를 가진다
  - 잘못된 값 입력 시 기본값 처리 로직이 동작한다

## T-003 localStorage 영속화
- Priority: P0
- Labels: P0, storage
- Summary: 저장/로드를 localStorage로 구현한다.
- Description:
  - loadItems, saveItems 유틸 작성
  - 앱 시작 시 로드, 변경 시 저장
  - 파싱 오류 발생 시 안전 복구
- Acceptance Criteria:
  - 새로고침 후 데이터가 유지된다
  - 저장 데이터가 깨져 있어도 앱이 중단되지 않는다

## T-004 물건 추가 플로우
- Priority: P0
- Labels: P0, feature, ui
- Summary: FAB에서 추가 폼을 열고 아이템을 저장한다.
- Description:
  - 하단 플로팅 + 버튼 구현
  - 추가 모달 또는 시트 구현
  - 필수값 검증(name, location, category)
- Acceptance Criteria:
  - 유효 입력으로 저장 시 카드가 즉시 보인다
  - 필수값 누락 시 명확한 에러 안내가 보인다

## T-005 목록 렌더링과 카테고리 그룹
- Priority: P0
- Labels: P0, feature, ui
- Summary: 카테고리별 그룹 헤더와 카드 목록을 렌더링한다.
- Description:
  - 그룹핑 로직 구현
  - 카드 정보(name, location, quantity, memo, badge) 표시
  - 빈 상태 화면 구현
- Acceptance Criteria:
  - 아이템이 정확한 카테고리 그룹에 나타난다
  - 데이터가 없을 때 빈 상태 UI가 보인다

## T-006 이미지 썸네일과 폴백
- Priority: P0
- Labels: P0, feature, ui
- Summary: 이름 기반 썸네일을 표시하고 실패 시 이모지로 폴백한다.
- Description:
  - 키워드 기반 이미지 URL 생성 함수 구현
  - 카드에 이미지 렌더링
  - 로드 실패 시 카테고리 이모지 표시
- Acceptance Criteria:
  - 이미지 로드 성공 시 썸네일이 노출된다
  - 실패 시 앱 기능 저하 없이 이모지 폴백이 동작한다

## T-007 검색 및 카테고리 필터
- Priority: P0
- Labels: P0, feature
- Summary: 이름/위치 검색과 카테고리 필터를 동시 지원한다.
- Description:
  - 상단 검색 입력 구현
  - 카테고리 칩 필터 구현(전체 포함)
  - 검색 + 필터 복합 조건 반영
- Acceptance Criteria:
  - 입력 즉시 실시간 필터링된다
  - 검색과 카테고리 필터를 동시에 적용할 수 있다

## T-008 수정 및 삭제
- Priority: P0
- Labels: P0, feature
- Summary: 기존 아이템을 수정하고 삭제할 수 있어야 한다.
- Description:
  - 카드 액션으로 수정 진입
  - 수정 저장 시 원본 업데이트
  - 삭제 시 제거 및 저장 반영
- Acceptance Criteria:
  - 수정 결과가 즉시 목록과 저장소에 반영된다
  - 삭제 후 카드가 사라지고 새로고침해도 복구되지 않는다

## T-009 마이크로 인터랙션 및 스타일 완성
- Priority: P0
- Labels: P0, ui, animation
- Summary: 깜찍한 톤과 핵심 애니메이션을 적용한다.
- Description:
  - 파스텔 기반 테마 토큰 정의
  - 추가 시 bounce, 삭제 시 fade-out 애니메이션
  - 터치 친화 간격/버튼 크기 보정
- Acceptance Criteria:
  - 모바일에서 조작성이 좋다
  - 추가/삭제 애니메이션이 눈에 띄게 동작한다

## T-010 MVP 검증 테스트
- Priority: P0
- Labels: P0, test
- Summary: PRD 수용 기준을 수동 테스트로 검증한다.
- Description:
  - 추가/유지/검색/필터/수정/삭제 테스트
  - 이미지 실패 상황 폴백 테스트
  - 모바일 화면 점검
- Acceptance Criteria:
  - MVP 수용 기준 항목이 모두 통과된다
  - 주요 실패 케이스 재현 및 처리 확인 완료

---

## T-011 위치별 보기 토글
- Priority: P1
- Labels: P1, enhancement
- Summary: 카테고리별 보기와 위치별 보기를 전환한다.
- Acceptance Criteria:
  - 토글 시 그룹 기준이 즉시 전환된다
  - 기존 검색/필터와 충돌하지 않는다

## T-012 온보딩 또는 샘플 데이터
- Priority: P1
- Labels: P1, ui
- Summary: 첫 진입 사용자를 위한 안내를 제공한다.
- Acceptance Criteria:
  - 첫 진입에서 사용법이 명확하다
  - 사용자 데이터가 생기면 안내 UI는 자연스럽게 사라진다

## T-013 수량 빠른 조절
- Priority: P1
- Labels: P1, enhancement
- Summary: 카드에서 +/-로 수량을 즉시 조정한다.
- Acceptance Criteria:
  - 탭 한 번으로 수량 증감이 반영된다
  - 수량 하한(예: 1) 규칙이 지켜진다

---

## T-014 Azure 배포
- Priority: P0
- Labels: P0, deploy, azure
- Summary: 앱을 Azure에 배포하고 공개 URL을 확보한다.
- Description:
  - 배포 대상 선택(SWA 또는 App Service)
  - azd 초기화 및 배포
  - 모바일 접속 테스트
- Acceptance Criteria:
  - 외부 네트워크에서 URL 접속 가능
  - 핵심 기능 데모가 정상 동작

## T-015 데모 리허설
- Priority: P0
- Labels: P0, demo
- Summary: 발표 시나리오를 리허설하고 리스크를 제거한다.
- Description:
  - 빈 상태에서 3~4개 추가
  - 검색/필터/수정/삭제 시연
  - 이미지 실패 폴백 시연 포함
- Acceptance Criteria:
  - 2~3분 내 끊김 없이 시연 가능
  - 네트워크 이슈 상황에서도 대체 흐름이 준비됨

---

## 선택 AI 티켓 (시간 여유 시 1개만)

## T-016 자동 카테고리 추천
- Priority: P2
- Labels: P2, ai
- Summary: 이름 입력 시 카테고리를 자동 제안한다.
- Acceptance Criteria:
  - 추천 결과를 사용자가 채택/수정할 수 있다
  - 추천 실패 시 수동 입력 흐름이 유지된다

## T-017 자연어 검색
- Priority: P2
- Labels: P2, ai
- Summary: 모호한 질의를 검색 조건으로 해석한다.
- Acceptance Criteria:
  - 일반 검색 대비 발견성이 향상된다
  - 실패 시 기존 검색 기능으로 자연스럽게 폴백된다

## T-018 자연어 추가
- Priority: P2
- Labels: P2, ai
- Summary: 한 문장을 파싱해 입력 폼을 자동 채운다.
- Acceptance Criteria:
  - 이름/위치/수량이 높은 정확도로 채워진다
  - 파싱 실패 시 사용자가 쉽게 수정 가능하다

---

## 추천 스프린트(해커톤 4시간)
- Sprint A (0:00~1:30): T-001, T-002, T-003, T-004
- Sprint B (1:30~2:30): T-005, T-006, T-007, T-008
- Sprint C (2:30~3:20): T-009, T-010
- Sprint D (3:20~4:00): T-014, T-015
