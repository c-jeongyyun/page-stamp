# Page Stamp - 개발 태스크

> 기준: `docs/spec.md` MVP 범위
> 현재 상태: 플러그인 스켈레톤만 존재 (UI 닫기 버튼만 구현됨)

---

## 0. 공통 준비

- [ ] **메시지 타입 인터페이스 정의** (`src/types.ts` 신규)
  - UI → code.ts 메시지: `apply`, `refresh`, `remove-all`, `get-components`, `close`
  - code.ts → UI 메시지: `section-list`, `component-list`, `done`, `error`
  - 공유 설정 타입: `PluginSettings` (섹션 ID, 컴포넌트 ID, 텍스트 레이어명, 포지셔닝 모드, x/y, 번호 포맷, 시작 번호)

---

## 1. Backend — `src/code.ts`

### 1-1. 섹션 목록 조회

- [ ] 플러그인 시작 시 `figma.root.findAllWithCriteria({ types: ['SECTION'] })`로 전체 섹션 조회
- [ ] `{ id, name }` 목록을 UI에 `section-list` 메시지로 전송

### 1-2. 파일 내 컴포넌트 목록 조회

- [ ] `figma.root.findAllWithCriteria({ types: ['COMPONENT'] })`로 전체 컴포넌트 조회
- [ ] `{ id, name }` 목록을 UI에 `component-list` 메시지로 전송
- [ ] 플러그인 시작 시 자동으로 한 번 조회
- [ ] `get-components` 메시지 수신 시 재조회 후 전송

### 1-3. TL 정렬 로직

- [ ] `sortByTL(frames: FrameNode[])` 함수 구현
  - y 좌표 차이가 THRESHOLD(10px) 미만이면 같은 행으로 판단, x 오름차순
  - 그 외에는 y 오름차순

### 1-4. 기본 컴포넌트 자동 생성

- [ ] `createDefaultPageNumberComponent(frames)` 함수 구현 (spec 6.2 참고)
  - 컴포넌트명: `PageNumber / Default`, 크기 60×32px
  - 검정 배경 Rectangle (cornerRadius 4px)
  - 텍스트 레이어명 `{page_number}`, Inter Regular 14px, 흰색
  - 오토레이아웃 (가로/세로 중앙, 패딩 12/8px)
  - TL 정렬 기준 첫 번째 프레임 우측 40px 간격에 배치
- [ ] 생성 후 컴포넌트 ID를 UI에 반환

### 1-5. 컴포넌트 인스턴스 삽입 (적용하기)

- [ ] `settings.sectionId`로 섹션 노드 조회 후 직계 자식 `FrameNode` 목록 추출
- [ ] 추출된 프레임을 TL 정렬
- [ ] 각 프레임에 컴포넌트 인스턴스 생성 (`component.createInstance()`)
- [ ] **Absolute 모드**: `instance.layoutPositioning = 'ABSOLUTE'` 후 x, y 설정
- [ ] **Auto Layout 모드**: 일반 자식으로 append (layoutPositioning 미설정)
- [ ] 인스턴스에 `setPluginData('isPageNumber', 'true')` 태깅
- [ ] 텍스트 레이어(`{page_number}`)에 번호 주입 (spec 6.4 참고)
- [ ] 번호 포맷 처리: 단순 번호 (`1`, `2`, `3`)
- [ ] 시작 번호(`startNumber`) 반영

### 1-6. 번호 갱신 (다시 적용)

- [ ] `refreshPageNumbers(settings)` 함수 구현 (spec 6.5 참고)
  - `settings.sectionId`로 섹션 직계 자식 프레임 목록 추출
  - 전체 프레임을 TL 정렬 → 인덱스 기반 번호 결정
  - 각 프레임에서 `getPluginData('isPageNumber') === 'true'` 인스턴스 탐색
  - 인스턴스 없으면 건너뜀 (재삽입 안 함)
  - 있으면 텍스트만 갱신

### 1-7. 전체 제거

- [ ] `removeAllPageNumbers(settings)` 함수 구현
  - `settings.sectionId`로 섹션 직계 자식 프레임 목록 추출
  - 각 프레임에서 `isPageNumber` 태그된 노드 탐색 후 `node.remove()`

### 1-8. 메시지 핸들러 연결

- [ ] `figma.ui.onmessage` 에서 각 메시지 타입에 대한 핸들러 분기
  - `apply` → 인스턴스 삽입
  - `refresh` → 번호 갱신
  - `remove-all` → 전체 제거
  - `get-components` → 컴포넌트 목록 재조회
  - `close` → `figma.closePlugin()`

---

## 2. Frontend — `src/App.tsx`

### 2-1. 초기화 및 상태 관리

- [ ] 플러그인 시작 시 code.ts로부터 `section-list`, `component-list` 수신 대기
- [ ] `onmessage` 핸들러 등록 (code.ts 응답 수신)
- [ ] 전역 상태 정의: 섹션 목록, 선택된 섹션 ID, 컴포넌트 목록, 폼 설정값

### 2-2. STEP 1 — 섹션 선택

- [ ] 섹션 드롭다운 (`<select>`) 표시 — `section-list` 수신 시 목록 렌더링
- [ ] 섹션 선택 시 `sectionId`를 UI 상태에 저장 (sandbox 통신 없음)
- [ ] 섹션 없을 시 안내 문구 표시 ("캔버스에 섹션을 만들어주세요")

### 2-3. STEP 2 — 컴포넌트 선택

- [ ] 라디오 버튼: "파일 내 컴포넌트 사용" / "기본 컴포넌트 자동 생성"
- [ ] **파일 내 컴포넌트 사용** 선택 시:
  - 컴포넌트 드롭다운 (`<select>`) 표시 — `component-list` 수신 목록 렌더링
  - 컴포넌트 선택 시 `componentId`를 UI 상태에 저장 (sandbox 통신 없음)
  - 텍스트 레이어명 입력 필드 (기본값: `{page_number}`)
- [ ] **기본 컴포넌트 자동 생성** 선택 시:
  - 드롭다운 숨기고 인라인 안내 문구 표시 (spec 4.2 참고)

### 2-4. STEP 3 — 위치 설정

- [ ] 삽입 방식 라디오: "Absolute" / "Auto Layout"
- [ ] **Absolute 선택 시**: X, Y 숫자 입력 필드 표시 (기본값 40, 40)
- [ ] **Auto Layout 선택 시**: X, Y 입력 필드 숨김

### 2-5. STEP 4 — 번호 포맷 (MVP)

- [ ] 단순 번호 형식만 표시 (`1`, `2`, `3`) — v2에서 확장 예정
- [ ] 시작 번호 입력 필드 (기본값: 1)

### 2-6. 하단 액션 버튼

- [ ] **제거** 버튼 → `remove-all` 메시지 발송 (현재 설정값 포함)
- [ ] **다시 적용** 버튼 → `refresh` 메시지 발송 (현재 설정값 포함)
- [ ] **적용하기** 버튼 → `apply` 메시지 발송 (현재 설정값 포함)
- [ ] 섹션 미선택 또는 컴포넌트 미선택 시 적용 버튼 비활성화

### 2-7. UI 스타일링

- [ ] 기본 레이아웃 및 스타일 적용 (Figma 플러그인 UI 가이드라인 준수)
- [ ] 각 STEP 섹션 구분선 및 레이블 스타일
- [ ] 버튼 상태 (활성/비활성) 스타일

---

## 3. 통합 및 검증

- [ ] 전체 메시지 흐름 연결 확인 (UI ↔ code.ts)
- [ ] `pnpm build` 빌드 에러 없음 확인
- [ ] Figma에서 직접 로드하여 기본 플로우 수동 테스트
  - 섹션 선택 → 컴포넌트 선택 → 적용하기
  - 적용 후 다시 적용(갱신) 동작 확인
  - 인스턴스 수동 삭제 후 갱신 시 건너뜀 확인
  - 전체 제거 동작 확인
  - Absolute / Auto Layout 모드 각각 확인

---

## v2 백로그 (MVP 이후)

- [ ] 순서 미리보기 UI (TL 정렬 결과를 번호와 함께 시각화)
- [ ] `1 / 10`, `1 of 10` 포맷 지원
- [ ] 시작 번호 및 특정 슬라이드 제외 옵션
- [ ] 위치 프리셋 버튼 (우하단, 좌하단, 우상단, 좌상단, 중앙하단)
- [ ] 정렬 기준 커스터마이징 (x 우선 / y 우선)
