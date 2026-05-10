# Page Stamp — UI Layer 구현 실행 계획

## Context

Sandbox 레이어(bridge, pluginController, pageStampService)와 타입 정의는 완전히 구현되어 있다. 플러그인을 실제로 동작시키려면 UI 레이어가 필요하다. 현재 `App.tsx`는 Close 버튼만 있는 placeholder 상태이며, `src/ui/bridge.ts`(UIBridge)도 아직 존재하지 않는다. 이 계획은 spec.md의 MVP 기능 전체를 커버하는 UI를 구현한다.

---

## 구현 범위 (MVP)

spec.md §7 기준:

| 기능                        | 상태                |
| --------------------------- | ------------------- |
| TL 방향 자동 정렬           | ✅ 완료 (서비스)    |
| 컴포넌트 인스턴스 삽입      | ✅ 완료 (서비스)    |
| 기본 컴포넌트 자동 생성     | ✅ 완료 (서비스)    |
| Absolute / Auto Layout 모드 | ❌ **UI 구현 필요** |
| x, y 좌표 입력              | ❌ **UI 구현 필요** |
| 단순 번호 포맷 (1, 2, 3)    | ✅ 완료 (서비스)    |
| 번호 갱신 (다시 적용)       | ❌ **UI 구현 필요** |
| 전체 제거                   | ❌ **UI 구현 필요** |
| **UIBridge**                | ❌ **미구현**       |
| **App.tsx 전체 UI**         | ❌ **미구현**       |

---

## Task 1 — UIBridge (`src/ui/bridge.ts`)

SandboxBridge의 UI 사이드 미러. architecture.md §Bridge 구조 참고.

```text
send(msg: UiMessage): void
  → parent.postMessage({ pluginMessage: msg }, '*')

on<T extends SandboxMessage['type']>(type, handler): void
  → 타입별 핸들러 등록 (중복 등록 시 에러)

listen(): void
  → window.onmessage 바인딩
  → pluginMessage.type 기준으로 등록된 핸들러 디스패치
  → 알 수 없는 타입은 무시
```

**수신 유효 타입**: `'section-list' | 'component-list' | 'done' | 'error'`

---

## Task 2 — `usePluginBridge` 커스텀 훅 (`src/ui/hooks/usePluginBridge.ts`)

상태 관리와 UIBridge 연결 로직을 훅으로 분리한다. App.tsx는 이 훅을 호출해 값과 핸들러를 받아 컴포넌트에 전달하는 조립 역할만 담당한다.

### 훅이 관리하는 상태

```ts
// 원격 데이터
sections: FigmaSectionInfo[]
components: FigmaComponentInfo[]

// STEP 1
sectionId: string

// STEP 2
useDefaultComponent: boolean      // 라디오
componentId: string               // 파일 내 컴포넌트 선택 시
textLayerName: string             // 기본값: '{page_number}'

// STEP 3
positioningMode: 'ABSOLUTE' | 'AUTO_LAYOUT'
position: { x: number; y: number }  // 기본값: { x: 40, y: 40 }

// STEP 4
startNumber: number               // 기본값: 1

// 작업 상태
status: 'idle' | 'loading' | 'error' | 'done'
errorMessage: string
```

### 훅이 반환하는 값

- 위 모든 상태값 + 각 setter
- `onApply`, `onRefresh`, `onRemove` 액션 함수
- `isValid: boolean` — 적용하기 버튼 활성화 여부

### 유효성 검사 (`isValid`) 규칙

모든 조건을 만족해야 `isValid === true`:

- STEP 1: `sectionId` 비어 있지 않음
- STEP 2 (`useDefaultComponent === false`): `componentId` 비어 있지 않음, `textLayerName` 비어 있지 않음
- STEP 3 (`positioningMode === 'ABSOLUTE'`): `position.x`, `position.y` 가 유효한 숫자
- STEP 4: `startNumber >= 1`

### 초기화 흐름 (useEffect)

1. UIBridge 인스턴스 생성 + `listen()` 호출
2. `on('section-list')` → sections 상태 업데이트
3. `on('component-list')` → components 상태 업데이트
4. `on('done')` → status: 'done' (Toast 표시 후 'idle'로 복귀)
5. `on('error')` → status: 'error' + errorMessage 업데이트

Sandbox가 플러그인 시작 시 `section-list`, `component-list`를 자동 전송하므로 (`code.ts` 참고) 마운트 시 별도 요청 불필요.

### App.tsx 역할

훅 호출 + 컴포넌트 조립만 담당:

```tsx
export default function App() {
  const { sections, sectionId, setSectionId, ..., onApply, onRefresh, onRemove } = usePluginBridge();
  return (
    <div>
      <Step1Section sections={sections} sectionId={sectionId} onChange={setSectionId} />
      <Step2Component ... />
      <Step3Position ... />
      <Step4Format ... />
      <ActionBar status={status} onApply={onApply} onRefresh={onRefresh} onRemove={onRemove} />
      {status === 'error' && <Toast type="error" message={errorMessage} />}
    </div>
  );
}
```

---

## Task 3 — 공통 UI 컴포넌트 (`src/ui/components/common/`)

Step 컴포넌트 구현 전에 먼저 추출. 아래 원시 요소는 2개 이상의 Step에서 반복 사용된다.

| 공통 컴포넌트     | 사용처                                      |
| ----------------- | ------------------------------------------- |
| `Select.tsx`      | Step1(섹션), Step2(컴포넌트)                |
| `RadioGroup.tsx`  | Step2(컴포넌트 선택 방식), Step3(삽입 방식) |
| `NumberInput.tsx` | Step3(X값, Y값), Step4(시작 번호)           |
| `FormField.tsx`   | 모든 Step의 label + 하위 입력 래퍼          |
| `Button.tsx`      | ActionBar(제거, 다시 적용, 적용하기)        |
| `Toast.tsx`       | App.tsx(에러/완료 상태 표시)                |

- **Select** — `options: { value, label }[]`, `value`, `onChange`, `disabled?`
- **RadioGroup** — `options: { value, label }[]`, `value`, `onChange`
- **NumberInput** — `value: number`, `onChange`, `min?`, `placeholder?`
- **FormField** — `label: string`, `children` — label + children 수직 배치
- **Button** — `variant: 'primary' | 'secondary' | 'ghost'`, `disabled?`, `onClick`, `children`
- **Toast** — `message: string`, `type: 'error' | 'success'`, `onDismiss?` — 패널 하단에 고정, 일정 시간 후 자동 dismiss

---

## Task 4 — Step UI 컴포넌트 트리

```text
src/ui/
  bridge.ts                     ← Task 1
  App.tsx                       ← Task 4 조립 전용 (hooks + components import)
  hooks/
    usePluginBridge.ts          ← Task 2 (상태 + UIBridge 연결)
  components/
    common/
      Select.tsx                ← Task 3
      RadioGroup.tsx            ← Task 3
      NumberInput.tsx           ← Task 3
      FormField.tsx             ← Task 3
      Button.tsx                ← Task 3
      Toast.tsx                 ← Task 3
    domain/
      Step1Section.tsx          ← 섹션 선택 드롭다운
      Step2Component.tsx        ← 라디오 + 컴포넌트 드롭다운 / 인라인 가이드
      Step3Position.tsx         ← 삽입 방식 라디오 + X/Y 입력
      Step4Format.tsx           ← 시작 번호 입력
      ActionBar.tsx             ← 제거 / 다시 적용 / 적용하기

src/ui/__tests__/              ← TDD: 각 구현 파일의 테스트 (구현 전 작성)
  hooks/
    usePluginBridge.test.ts
  components/
    common/
      Select.test.tsx
      RadioGroup.test.tsx
      NumberInput.test.tsx
      FormField.test.tsx
      Button.test.tsx
      Toast.test.tsx
    domain/
      Step1Section.test.tsx
      Step2Component.test.tsx
      Step3Position.test.tsx
      Step4Format.test.tsx
      ActionBar.test.tsx
  App.test.tsx
```

### Step1Section

- props: `sections`, `sectionId`, `onChange`
- `<select>` 드롭다운. sections가 비어 있으면 "섹션 없음" disabled 옵션 표시

### Step2Component

- props: `useDefaultComponent`, `components`, `componentId`, `textLayerName`, `onChange*`
- 라디오 2개: "파일 내 컴포넌트 사용" / "기본 컴포넌트 자동 생성"
- useDefaultComponent=false → 컴포넌트 드롭다운 + 텍스트 레이어명 입력
- useDefaultComponent=true → 인라인 안내 문구 (첫 프레임 오른쪽 배치 + 스타일 안내)

### Step3Position

- props: `positioningMode`, `position`, `onChange*`
- 라디오: Absolute / Auto Layout
- Absolute 선택 시 X / Y 입력 필드 표시 (숫자, 기본값 40/40)
- Auto Layout 선택 시 입력 필드 숨김

### Step4Format

- props: `startNumber`, `onChange`
- 시작 번호 숫자 입력 (min=1, 기본값=1)

### ActionBar

- props: `status`, `isValid`, `onRemove`, `onRefresh`, `onApply`
- 버튼 3개: 제거 / 다시 적용 / 적용하기
- status==='loading' 시 모든 버튼 disabled
- 적용하기: `isValid === false` 이면 추가로 disabled (필수값 미입력 시 비활성화)

### 버튼 동작 (mold 조립 → send)

```ts
function buildMold(): PageStampMold {
  return { sectionId, componentId, useDefaultComponent,
           textLayerName, positioningMode, position,
           pagingFormat: 'simple', startNumber };
}

onApply   → bridge.send({ type: 'apply',      mold: buildMold() })
onRefresh → bridge.send({ type: 'refresh',    mold: buildMold() })
onRemove  → bridge.send({ type: 'remove-all', mold: buildMold() })
```

---

## Design 가이드라인 (DESIGN.md 준수)

플러그인 패널(320×480px)에 Figma 마케팅 디자인 시스템을 압축 적용:

| 요소           | 적용                                                        |
| -------------- | ----------------------------------------------------------- |
| 폰트           | Inter (figmaSans 대체, DESIGN.md §Typography 참고)          |
| Primary 버튼   | 검정 배경 + 흰 텍스트, `border-radius: 50px` (pill)         |
| Secondary 버튼 | 흰 배경 + 검정 텍스트, pill                                 |
| 입력 필드      | `border-radius: 8px` (rounded.md), hairline border          |
| 간격 단위      | 8px base (`spacing.xs`=8, `spacing.md`=16, `spacing.lg`=24) |
| 색상           | 검정 #000, 흰 #FFF, hairline #E5E5E5                        |
| 그림자         | 사용하지 않음 (DESIGN.md §Do Not)                           |

---

## 주요 파일 경로

| 파일                                          | 상태        |
| --------------------------------------------- | ----------- |
| `src/ui/bridge.ts`                            | 신규 생성   |
| `src/ui/hooks/usePluginBridge.ts`             | 신규 생성   |
| `src/ui/App.tsx`                              | 전면 재작성 |
| `src/ui/components/common/Select.tsx`         | 신규 생성   |
| `src/ui/components/common/RadioGroup.tsx`     | 신규 생성   |
| `src/ui/components/common/NumberInput.tsx`    | 신규 생성   |
| `src/ui/components/common/FormField.tsx`      | 신규 생성   |
| `src/ui/components/common/Button.tsx`         | 신규 생성   |
| `src/ui/components/common/Toast.tsx`          | 신규 생성   |
| `src/ui/components/domain/Step1Section.tsx`   | 신규 생성   |
| `src/ui/components/domain/Step2Component.tsx` | 신규 생성   |
| `src/ui/components/domain/Step3Position.tsx`  | 신규 생성   |
| `src/ui/components/domain/Step4Format.tsx`    | 신규 생성   |
| `src/ui/components/domain/ActionBar.tsx`      | 신규 생성   |
| `src/ui/ui.tsx`                               | 변경 없음   |
| `src/sandbox/*.ts`                            | 변경 없음   |
| `src/types/*.ts`                              | 변경 없음   |

---

## 구현 순서 (TDD: 테스트 → 구현 → 통과)

0. `docs/spec.md` 업데이트 — §4에 "적용하기 버튼 활성화 조건" 항목 추가
1. `src/ui/bridge.ts` — UIBridge (타입 기반 구현, 단순 래핑이므로 테스트 생략 가능)
2. `usePluginBridge.test.ts` 작성 → `usePluginBridge.ts` 구현 → 통과
3. `common/` 컴포넌트 6종 (각각 테스트 작성 → 구현 → 통과): Select, RadioGroup, NumberInput, FormField, Button, Toast
4. `domain/Step1Section.test.tsx` 작성 → `Step1Section.tsx` 구현 → 통과
5. `domain/Step2Component.test.tsx` 작성 → `Step2Component.tsx` 구현 → 통과
6. `domain/Step3Position.test.tsx` 작성 → `Step3Position.tsx` 구현 → 통과
7. `domain/Step4Format.test.tsx` 작성 → `Step4Format.tsx` 구현 → 통과
8. `domain/ActionBar.test.tsx` 작성 → `ActionBar.tsx` 구현 → 통과
9. `App.test.tsx` 작성 → `App.tsx` 조립 → 통과
10. `pnpm test` + `pnpm typecheck` + `pnpm build` 최종 확인

---

## TDD 접근 방식

**테스트 스택**: Vitest + jsdom + @testing-library/preact + @testing-library/user-event

- `parent.postMessage` — `setup.ts`에서 `vi.fn()`으로 전역 모킹 완료
- `window.onmessage` — 각 테스트에서 직접 dispatch하여 sandbox → UI 메시지 시뮬레이션
- MSW — 현재 외부 API 없어 사용 안 함

**각 단계별 규칙**: 테스트 파일을 먼저 작성 → `pnpm test` 실패 확인 → 구현 → 통과 확인 후 다음 단계 진행

### 테스트 핵심 케이스 (예시)

**usePluginBridge**: 마운트 시 window.onmessage 바인딩, `section-list` 수신 시 sections 상태 업데이트, isValid 조건별 true/false

**common 컴포넌트**: 렌더링, 사용자 인터랙션(onChange 호출), disabled 상태, prop 변경 반응

**domain 컴포넌트**: 조건부 렌더링(useDefaultComponent 분기, positioningMode 분기), 필수값 검사

**ActionBar**: isValid=false 시 적용하기 disabled, status=loading 시 전체 disabled, 각 버튼 클릭 시 콜백 호출

## 검증

```bash
pnpm test        # 전체 테스트 통과 (sandbox + ui)
pnpm typecheck   # 타입 에러 0개
pnpm build       # dist/code.js + dist/ui.html 생성
```

Figma Desktop에서 `manifest.json`으로 플러그인 로드 후 수동 확인:

- [ ] 섹션 드롭다운에 파일 내 섹션 목록 표시
- [ ] 컴포넌트 드롭다운에 파일 내 컴포넌트 목록 표시
- [ ] "기본 컴포넌트 자동 생성" 선택 시 드롭다운 숨김 + 안내 문구 표시
- [ ] Absolute 선택 시 X/Y 입력 표시, Auto Layout 선택 시 숨김
- [ ] 적용하기 → 각 프레임에 인스턴스 삽입 + 번호 주입
- [ ] 다시 적용 → 기존 인스턴스 번호 텍스트 갱신
- [ ] 제거 → 모든 인스턴스 삭제
- [ ] 작업 중 버튼 disabled 처리
- [ ] 에러 발생 시 Toast 에러 메시지 표시 + 자동 dismiss
- [ ] 적용하기 성공 시 Toast 완료 메시지 표시
