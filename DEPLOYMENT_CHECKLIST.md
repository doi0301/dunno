# 배포 체크리스트 & 실행 가이드

## 배포 준비 상태 ✅
- [x] 정적 웹앱 코드 완성
- [x] azd 프로젝트 초기화
- [x] azure.yaml 정적 웹앱 설정 추가
- [ ] Azure 구독 연결 (아직)
- [ ] 환경 생성 (아직)
- [ ] 배포 실행 (아직)

## 배포 명령어 (순서대로 실행)
```bash
# 1. 환경 생성 (첫 실행 시 구독/리전 선택)
azd env new hack0620

# 2. Azure에 배포 (Static Web Apps 자동 생성)
azd up
```

## 배포 후 확인
1. Azure Portal에서 Static Web Apps 리소스 생성 확인
2. 공개 URL 접속 테스트
3. 기능 점검:
   - 물건 추가/삭제
   - 카테고리별/위치별 보기
   - 이미지 검색/업로드/촬영
   - 필터/검색

## 역롤백 시 명령어
```bash
# 배포된 리소스 삭제
azd down
```

## 주의사항
- 첫 `azd up`은 3-5분 소요 (Static Web Apps 프로비저닝)
- 이미지 소스(Unsplash) 응답 불안정 시 이모지 폴백 적용됨
- 데이터는 브라우저 localStorage에만 저장 (각 사용자별 로컬)
