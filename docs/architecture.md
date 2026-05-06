# Page Stamp — Architecture

## 전체 구조

```mermaid
graph TD
    subgraph Figma["Figma Plugin Runtime"]
        subgraph UI["UI Thread (dist/ui.html)"]
            App["App.tsx\n플러그인 패널 UI"]
            UIBridge["UIBridge\nsrc/ui/bridge.ts"]
        end

        subgraph Sandbox["Plugin Sandbox (dist/code.js)"]
            SandboxBridge["SandboxBridge\nsrc/sandbox/bridge.ts"]
            SectionQuery["getSections()\n섹션 목록 조회"]
            TL["sortByTL()\nTL 방향 정렬"]
            CompQuery["getComponents()\n컴포넌트 목록 조회"]
            CompCreate["createDefaultComponent()\n기본 컴포넌트 생성"]
            Apply["applyPageNumbers()\n인스턴스 삽입"]
            Refresh["refreshPageNumbers()\n번호 갱신"]
            Remove["removeAllPageNumbers()\n전체 제거"]
        end

        subgraph FigmaAPI["Figma API"]
            Canvas["캔버스\n(FrameNode 목록)"]
            Components["컴포넌트\n(ComponentNode)"]
            Instances["인스턴스\n(InstanceNode)"]
            PluginData["pluginData\n(isPageNumber 태그)"]
        end
    end

    App -- "UIBridge.send()" --> UIBridge
    UIBridge -- "parent.postMessage()" --> SandboxBridge
    SandboxBridge -- "figma.ui.postMessage()" --> UIBridge
    UIBridge -- "등록된 핸들러 호출" --> App

    SandboxBridge -- "on('apply')" --> Apply
    SandboxBridge -- "on('refresh')" --> Refresh
    SandboxBridge -- "on('remove-all')" --> Remove
    SandboxBridge -- "on('get-components')" --> CompQuery

    Apply --> SectionQuery
    Refresh --> SectionQuery
    Remove --> SectionQuery
    SectionQuery --> TL

    CompQuery --> Components
    CompCreate --> Components
    Apply --> Instances
    Apply --> PluginData
    Refresh --> PluginData
    Refresh --> Instances
    Remove --> PluginData
    Remove --> Instances
    Canvas --> SectionQuery
```

---

## 메시지 흐름

```mermaid
sequenceDiagram
    participant U as App.tsx (UI)
    participant UB as UIBridge
    participant SB as SandboxBridge
    participant C as code.ts (Sandbox)
    participant F as Figma API

    Note over U,F: 플러그인 시작
    C->>F: figma.showUI()
    SB->>F: findAllWithCriteria(COMPONENT)
    SB->>UB: send('component-list', [...])
    UB->>U: on('component-list') 핸들러 호출
    SB->>F: findAllWithCriteria(SECTION)
    SB->>UB: send('section-list', [...])
    UB->>U: on('section-list') 핸들러 호출

    Note over U,F: 컴포넌트 목록 새로고침 (필요 시)
    U->>UB: send('get-components')
    UB->>SB: parent.postMessage()
    SB->>C: on('get-components') 핸들러 호출
    C->>F: findAllWithCriteria(COMPONENT)
    SB->>UB: send('component-list', [...])
    UB->>U: on('component-list') 핸들러 호출

    Note over U: 섹션 드롭다운에서 선택 → sectionId UI 상태에 저장
    Note over U: 컴포넌트 드롭다운에서 선택 → componentId UI 상태에 저장

    Note over U,F: 적용하기
    U->>UB: send('apply', mold)
    UB->>SB: parent.postMessage()
    SB->>C: on('apply') 핸들러 호출
    C->>F: section.findChildren(FRAME)
    C->>F: sortByTL(frames)
    C->>F: component.createInstance()
    C->>F: instance.layoutPositioning = 'ABSOLUTE'
    C->>F: textLayer.characters = pageNumber
    C->>F: instance.setPluginData('isPageNumber', 'true')
    SB->>UB: send('done')
    UB->>U: on('done') 핸들러 호출

    Note over U,F: 다시 적용
    U->>UB: send('refresh', { startNumber })
    UB->>SB: parent.postMessage()
    SB->>C: on('refresh') 핸들러 호출
    C->>F: sortByTL(frames)
    C->>F: frame.findOne(isPageNumber)
    C->>F: textLayer.characters = pageNumber
    SB->>UB: send('done')
    UB->>U: on('done') 핸들러 호출

    Note over U,F: 전체 제거
    U->>UB: send('remove-all')
    UB->>SB: parent.postMessage()
    SB->>C: on('remove-all') 핸들러 호출
    C->>F: findAll(isPageNumber)
    C->>F: node.remove()
    SB->>UB: send('done')
    UB->>U: on('done') 핸들러 호출
```

---

## Bridge 구조 (방식 B — 타입별 핸들러 등록)

```mermaid
graph TD
    subgraph UIBridge["UIBridge (src/ui/bridge.ts)"]
        UISend["send(type, payload)\nparent.postMessage() 래핑"]
        UIOn["on(type, handler)\n타입별 핸들러 등록"]
        UIListen["listen()\nwindow.onmessage 바인딩\n→ 등록된 핸들러 디스패치"]
    end

    subgraph SandboxBridge["SandboxBridge (src/sandbox/bridge.ts)"]
        SBSend["send(type, payload)\nfigma.ui.postMessage() 래핑"]
        SBOn["on(type, handler)\n타입별 핸들러 등록"]
        SBListen["listen()\nfigma.ui.onmessage 바인딩\n→ 등록된 핸들러 디스패치"]
    end

    App -- "UIBridge.send('apply', mold)" --> UISend
    App -- "UIBridge.on('done', handler)" --> UIOn
    UIListen -- "handlers[type](payload)" --> App

    SBOn -- "handlers[type](payload)" --> Handlers["code.ts 핸들러들\napply / refresh / remove-all / get-components"]
    SBSend --> FigmaUIPostMessage["figma.ui.postMessage()"]
```

### 파일 위치

| 파일 | 역할 |
| --- | --- |
| `src/ui/bridge.ts` | UIBridge 모듈 — UI 스레드에서 import |
| `src/sandbox/bridge.ts` | SandboxBridge 모듈 — Plugin Sandbox에서 import |
| `src/types/domain.ts` | 도메인 타입 (FigmaSectionInfo, FigmaComponentInfo, Position, PagingFormat, PageStampMold) |
| `src/types/messages.ts` | 통신 타입 (UiMessage, SandboxMessage) |
| `src/types/index.ts` | 전체 re-export |

---

## UI 컴포넌트 트리

```mermaid
graph TD
    App --> Step1
    App --> Step2
    App --> Step3
    App --> Step4
    App --> Actions

    Step1["STEP 1\n섹션 선택"]
    Step1 --> SectionDropdown["섹션 드롭다운\n(section-list 반응)"]

    Step2["STEP 2\n컴포넌트 선택"]
    Step2 --> Radio{"라디오 선택"}
    Radio -- "파일 내 컴포넌트 사용" --> Dropdown["컴포넌트 드롭다운\n+ 텍스트 레이어명 입력"]
    Radio -- "기본 컴포넌트 자동 생성" --> InlineGuide["인라인 안내 문구"]

    Step3["STEP 3\n위치 설정"]
    Step3 --> PosRadio{"삽입 방식"}
    PosRadio -- "Absolute" --> XYInput["X / Y 좌표 입력"]
    PosRadio -- "Auto Layout" --> NoInput["(입력 필드 숨김)"]

    Step4["STEP 4\n번호 포맷 (MVP)"]
    Step4 --> StartNum["시작 번호 입력\n(기본값: 1)"]

    Actions["하단 버튼"]
    Actions --> BtnRemove["제거"]
    Actions --> BtnRefresh["다시 적용"]
    Actions --> BtnApply["적용하기"]
```

---

## 데이터 모델

```mermaid
classDiagram
    class PageStampMold {
        sectionId: string
        componentId: string
        useDefaultComponent: boolean
        textLayerName: string
        positioningMode: 'ABSOLUTE' | 'AUTO_LAYOUT'
        position: Position
        pagingFormat: PagingFormat
        startNumber: number
    }

    class Position {
        x: number
        y: number
    }

    class UiMessage {
        <<union>>
        type: 'apply' | 'refresh' | 'remove-all' | 'get-components' | 'close'
        mold: PageStampMold
    }

    class SandboxMessage {
        <<union>>
        type: 'section-list' | 'component-list' | 'done' | 'error'
        payload: FigmaSectionInfo[] | FigmaComponentInfo[] | ErrorInfo
    }

    class FigmaSectionInfo {
        id: string
        name: string
    }

    class FigmaComponentInfo {
        id: string
        name: string
    }

    PageStampMold --> Position : contains
    UiMessage --> PageStampMold : contains
    SandboxMessage --> FigmaSectionInfo : variant
    SandboxMessage --> FigmaComponentInfo : variant
```
