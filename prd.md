# DUNNO PRD

## 1. Product Overview

### Product Name
DUNNO - 어디뒀더라

### One-line Summary
집 안의 물건 위치와 수량을 빠르게 기록하고, 나중에 바로 찾을 수 있게 도와주는 개인 생활 정리 앱.

### Problem Statement
- 사용자는 물건을 어디에 두었는지 자주 잊어버린다.
- 비슷한 카테고리의 물건이 여러 방과 가구에 흩어져 있어 찾는 시간이 길어진다.
- 소모품은 수량을 정확히 기억하지 못해 중복 구매나 누락이 발생한다.

### Product Vision
검색보다 빠르게 기억을 보완하는 생활용 위치 기록 앱을 만든다.

## 2. Target Users

### Primary Users
- 1인 가구 및 자취생
- 집안 정리를 자주 하는 사용자
- 물건이 많은 가정 구성원

### User Needs
- 물건을 빠르게 등록하고 싶다.
- 방, 가구, 상세위치 기준으로 쉽게 찾고 싶다.
- 수량과 메모까지 함께 관리하고 싶다.
- 모바일에서도 쉽게 추가, 수정, 검색하고 싶다.

## 3. Goals

### Core Goals
- 10초 내 물건 등록 가능
- 이름 또는 위치 검색으로 빠른 탐색 가능
- 카테고리별, 위치별 2가지 탐색 방식 제공
- 로컬 저장 기반으로 로그인 없이 즉시 사용 가능

### Success Indicators
- 첫 물건 등록 완료율
- 검색 후 원하는 물건 재탐색 성공률
- 위치별 보기 사용 빈도
- 삭제 후 되돌리기 사용률

## 4. Non-goals

- 다중 사용자 협업
- 클라우드 동기화 계정 시스템
- 구매 내역/가계부 기능
- 바코드 스캔 기반 재고 관리

## 5. Current Scope

### Item Management
- 물건 추가, 수정, 삭제
- 수량 빠른 증감
- 메모 입력
- 이미지 URL 입력 또는 이미지 업로드/촬영

### Category Management
- 기본 카테고리 제공
- 사용자 카테고리 추가, 이름 변경, 삭제
- 이름 기반 카테고리 자동 추천

### Location Management
- 방, 가구, 상세위치의 3단계 위치 구조
- 방 추가, 이름 변경, 삭제
- 위치별 보기에서 방 및 장소 필터 제공

### Discovery
- 검색어 기반 필터링
- 카테고리별 보기
- 위치별 보기
- 하위 장소 필터

### UX and Platform
- 모바일 우선 레이아웃
- PWA 구성 지원
- 삭제 후 되돌리기 제공
- Azure 정적 웹사이트 배포 완료

## 6. User Flow

### Primary Flow: Add Item
1. 사용자가 + 버튼을 누른다.
2. 이름, 위치, 카테고리, 수량을 입력한다.
3. 필요 시 이미지와 메모를 추가한다.
4. 저장 후 리스트 상단에서 새 항목을 확인한다.

### Primary Flow: Find Item
1. 사용자가 검색어를 입력하거나 카테고리/위치 보기를 선택한다.
2. 방 또는 장소 필터를 조합한다.
3. 리스트에서 물건 카드의 위치와 메모를 확인한다.

### Primary Flow: Maintain Data
1. 사용자가 카드에서 수정 또는 수량 조절을 누른다.
2. 필요한 정보만 빠르게 변경한다.
3. 삭제 시 되돌리기 토스트를 통해 실수 삭제를 복구한다.

## 7. UX Principles

- 빠른 입력: 등록 단계는 짧고 명확해야 한다.
- 바로 찾기: 검색과 필터는 즉시 반응해야 한다.
- 모바일 친화성: 버튼 크기와 조작 영역은 터치 중심으로 설계한다.
- 실수 복구: 삭제 같은 파괴적 액션에는 복구 수단을 제공한다.
- 구조적 위치 표현: 위치는 방 > 가구 > 상세위치 형태로 일관되게 유지한다.

## 8. Functional Requirements

### Must Have
- 물건 CRUD
- 카테고리 CRUD
- 방 CRUD
- 검색 및 필터링
- 이미지 입력
- 로컬 저장

### Should Have
- 자동완성 제안
- 자동 카테고리 추천
- 설치 가능한 PWA 경험
- 삭제 되돌리기

### Could Have
- 최근 등록 정렬/정렬 옵션
- 즐겨찾기 또는 중요 표시
- 저수량 알림 UI
- 공유 가능한 백업/복원

## 9. Technical Notes

- 프레임워크 없는 정적 웹앱 구조
- 핵심 파일: index.html, style.css, app.js
- 데이터 저장: localStorage
- 배포 환경: Azure Storage Static Website
- PWA 자산: manifest.webmanifest, sw.js, app icons

## 10. Risks

- 업로드 이미지가 localStorage 용량을 빠르게 사용할 수 있음
- 외부 이미지 URL 의존 시 응답 실패 가능성 존재
- 단일 디바이스 로컬 저장 구조라 브라우저 변경 시 데이터 이전이 어려움

## 11. Next Improvements

### UX Improvements
- 탭 키보드 조작 개선
- 자동완성 표시값 원문 보존
- 카테고리 자동 추천을 제안형으로 전환
- 검색/필터 상태 요약 UI 제공

### Product Improvements
- 데이터 내보내기/가져오기
- 클라우드 동기화 옵션 검토
- 사용자 온보딩 개선

## 12. Release Status

- GitHub 저장소 연결 완료
- Azure 공개 배포 완료
- 최신 UX 개선 배포 완료
