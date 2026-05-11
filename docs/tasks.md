# Page Stamp - 개발 태스크

> 기준: `docs/spec.md` MVP 범위
> 현재 상태: 플러그인 스켈레톤만 존재 (UI 닫기 버튼만 구현됨)

---

## 0. 공통 준비

- [x] **메시지 타입 인터페이스 정의** (`src/types/` 디렉토리 신규)
  - `src/types/domain.ts`: `FigmaSectionInfo`, `FigmaComponentInfo`, `Position`, `PagingFormat`, `PageStampMold`
  - `src/types/messages.ts`: `UiMessage` (UI → Sandbox), `SandboxMessage` (Sandbox → UI)
  - `src/types/index.ts`: 전체 re-export
  - UI → Sandbox 메시지: `apply`, `refresh`, `remove-all`, `get-components`, `close`
  - Sandbox → UI 메시지: `section-list`, `component-list`, `done`, `error`
  - 공유 설정 타입: `PageStampMold` (섹션 ID, 컴포넌트 ID, useDefaultComponent, 텍스트 레이어명, 포지셔닝 모드, position: {x,y}, pagingFormat, 시작 번호)

---

## 1. Backend — `src/code.ts`

### 1-1. 섹션 목록 조회

- [x] 플러그인 시작 시 `figma.root.findAllWithCriteria({ types: ['SECTION'] })`로 전체 섹션 조회
- [x] `{ id, name }` 목록을 UI에 `section-list` 메시지로 전송

### 1-2. 파일 내 컴포넌트 목록 조회

- [x] `figma.root.findAllWithCriteria({ types: ['COMPONENT'] })`로 전체 컴포넌트 조회
- [x] `{ id, name }` 목록을 UI에 `component-list` 메시지로 전송
- [x] 플러그인 시작 시 자동으로 한 번 조회
- [x] `get-components` 메시지 수신 시 재조회 후 전송

### 1-3. TL 정렬 로직

- [x] `sortByTL(frames: FrameNode[])` 함수 구현
  - y 좌표 차이가 THRESHOLD(10px) 미만이면 같은 행으로 판단, x 오름차순
  - 그 외에는 y 오름차순

### 1-4. 기본 컴포넌트 자동 생성

- [x] `createDefaultPageNumberComponent(frames)` 함수 구현 (spec 6.2 참고)
  - 컴포넌트명: `PageNumber / Default`, 크기 60×32px
  - 검정 배경 Rectangle (cornerRadius 4px)
  - 텍스트 레이어명 `{page_number}`, Inter Regular 14px, 흰색
  - 오토레이아웃 (가로/세로 중앙, 패딩 12/8px)
  - TL 정렬 기준 첫 번째 프레임 우측 40px 간격에 배치

### 1-5. 컴포넌트 인스턴스 삽입 (적용하기)

- [x] `mold.sectionId`로 섹션 노드 조회 후 직계 자식 `FrameNode` 목록 추출
- [x] 추출된 프레임을 TL 정렬
- [x] 각 프레임에 컴포넌트 인스턴스 생성 (`component.createInstance()`)
- [x] **Absolute 모드**: `instance.layoutPositioning = 'ABSOLUTE'` 후 x, y 설정
- [x] **Auto Layout 모드**: 일반 자식으로 append (layoutPositioning 미설정)
- [x] 인스턴스에 `setPluginData('isPageNumber', 'true')` 태깅
- [x] 텍스트 레이어(`{page_number}`)에 번호 주입 (spec 6.4 참고)
- [x] 번호 포맷 처리: 단순 번호 (`1`, `2`, `3`)
- [x] 시작 번호(`startNumber`) 반영

### 1-6. 번호 갱신 (다시 적용)

- [x] `refreshPageNumbers(mold)` 함수 구현 (spec 6.5 참고)
  - `mold.sectionId`로 섹션 직계 자식 프레임 목록 추출
  - 전체 프레임을 TL 정렬 → 인덱스 기반 번호 결정
  - 각 프레임에서 `getPluginData('isPageNumber') === 'true'` 인스턴스 탐색
  - 인스턴스 없으면 건너뜀 (재삽입 안 함)
  - 있으면 텍스트만 갱신

### 1-7. 전체 제거

- [x] `removeAllPageNumbers(mold)` 함수 구현
  - `mold.sectionId`로 섹션 직계 자식 프레임 목록 추출
  - 각 프레임에서 `isPageNumber` 태그된 노드 탐색 후 `node.remove()`

### 1-8. 메시지 핸들러 연결

- [x] `figma.ui.onmessage` 에서 각 메시지 타입에 대한 핸들러 분기
  - `apply` → 인스턴스 삽입
  - `refresh` → 번호 갱신
  - `remove-all` → 전체 제거
  - `get-components` → 컴포넌트 목록 재조회
  - `close` → `figma.closePlugin()`

---

## 2. Frontend — `src/ui/`

### 2-0. 사전 준비

- [ ] `docs/spec.md` §4에 "적용하기 버튼 활성화 조건" 항목 추가

### 2-1. UIBridge (`src/ui/bridge.ts`)

- [x] `send(msg: UiMessage): void` — `parent.postMessage({ pluginMessage: msg }, '*')`
- [x] `on<T>(type, handler): void` — 타입별 핸들러 등록 (중복 등록 시 에러)
- [x] `listen(): void` — `window.onmessage` 바인딩 + 등록된 핸들러 디스패치
- [x] 알 수 없는 메시지 타입 무시

### 2-2. `usePluginBridge` 훅 (`src/ui/hooks/usePluginBridge.ts`)

**관리 상태**: `sections`, `components`, `sectionId`, `useDefaultComponent`, `componentId`, `textLayerName`, `positioningMode`, `position ({x:40, y:40})`, `startNumber (1)`, `status ('idle'|'loading'|'error'|'done')`, `errorMessage`

- [x] `usePluginBridge.test.ts` 먼저 작성 (마운트 시 바인딩, `section-list` 수신, `isValid` 조건별)
- [x] UIBridge 인스턴스 생성 + `listen()` 호출 (useEffect)
- [x] `on('section-list')` → `sections` 상태 업데이트
- [x] `on('component-list')` → `components` 상태 업데이트
- [x] `on('done')` → `status: 'done'` (Toast 표시 후 `'idle'` 복귀)
- [x] `on('error')` → `status: 'error'` + `errorMessage` 업데이트
- [x] `isValid` 유효성 검사: `sectionId` 필수, `useDefaultComponent=false` 시 `componentId`·`textLayerName` 필수, `positioningMode='ABSOLUTE'` 시 `position.x`·`position.y` 유효한 숫자, `startNumber >= 1`
- [x] `onApply`, `onRefresh`, `onRemove` — `buildMold()` 조립 후 `bridge.send()` 호출
- [x] 테스트 통과 확인

### 2-3. 공통 UI 컴포넌트 (`src/ui/components/common/`)

각 컴포넌트별 테스트 먼저 작성 후 구현:

- [ ] `Select.tsx` — `options: { value, label }[]`, `value`, `onChange`, `disabled?`
- [ ] `RadioGroup.tsx` — `options: { value, label }[]`, `value`, `onChange`
- [ ] `NumberInput.tsx` — `value: number`, `onChange`, `min?`, `placeholder?`
- [ ] `FormField.tsx` — `label: string`, `children` (label + children 수직 배치)
- [ ] `Button.tsx` — `variant: 'primary' | 'secondary' | 'ghost'`, `disabled?`, `onClick`, `children`
- [ ] `Toast.tsx` — `message: string`, `type: 'error' | 'success'`, `onDismiss?` (패널 하단 고정, 자동 dismiss)

### 2-4. Step 컴포넌트 + App.tsx 조립 (`src/ui/components/domain/`)

각 컴포넌트별 테스트 먼저 작성 후 구현:

- [ ] `Step1Section.tsx` — 섹션 드롭다운; sections 비어 있으면 "섹션 없음" disabled 옵션
- [ ] `Step2Component.tsx` — 라디오 2개 (파일 내 컴포넌트 / 기본 컴포넌트 자동 생성); `useDefaultComponent=false` 시 드롭다운 + 텍스트 레이어명 입력, `true` 시 인라인 안내 문구
- [ ] `Step3Position.tsx` — 삽입 방식 라디오 (Absolute / Auto Layout); Absolute 시 X·Y 숫자 입력 표시, Auto Layout 시 숨김
- [ ] `Step4Format.tsx` — 시작 번호 숫자 입력 (min=1, 기본값=1)
- [ ] `ActionBar.tsx` — 버튼 3개 (제거 / 다시 적용 / 적용하기); `status='loading'` 시 전체 disabled, `isValid=false` 시 적용하기 추가 disabled
- [ ] `App.test.tsx` 작성 → `App.tsx` 훅 호출 + 컴포넌트 조립으로 전면 재작성

### 2-5. 최종 확인

- [ ] `pnpm test` 전체 통과
- [ ] `pnpm typecheck` 에러 0개
- [ ] `pnpm build` `dist/code.js` + `dist/ui.html` 생성 확인
- [ ] Figma Desktop 수동 검증
  - 섹션 드롭다운에 파일 내 섹션 목록 표시
  - 컴포넌트 드롭다운에 파일 내 컴포넌트 목록 표시
  - "기본 컴포넌트 자동 생성" 선택 시 드롭다운 숨김 + 안내 문구 표시
  - Absolute 선택 시 X/Y 입력 표시, Auto Layout 선택 시 숨김
  - 적용하기 → 각 프레임에 인스턴스 삽입 + 번호 주입
  - 다시 적용 → 기존 인스턴스 번호 텍스트 갱신
  - 전체 제거 → 모든 인스턴스 삭제
  - 작업 중 버튼 disabled 처리
  - 에러 발생 시 Toast 에러 메시지 표시 + 자동 dismiss
  - 적용하기 성공 시 Toast 완료 메시지 표시

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
