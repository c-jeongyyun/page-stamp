
# What I Did  

## 260504

1. 기획서 도출
2. 기술 선정
3. 선정 기술 기반으로 환경 세팅 요청
4. 기획서 기반 태스크화
5. 구현 계획서(아키텍처) 문서 요청
6. window.postMessage, figma.ui.postMessage 캡슐화하도록 수정

---

## 260505

1. message type -> kebab case로 변경
2. frame 선택하는 것으로 되어있는 설계 -> 기존 기획대로 section 선택으로 변경
3. section 선택, component 선택 시 바로 sandbox로 보내는 것이 아닌, 적용하기 선택 시 sandbox로 section id, component id 만 보내지도록 수정
4. 변경된 architecture.md에 맞게 tasks.md(실행계획서) 수정

## 260506

1. CLAUDE.md 수정 - 금지 사항, 작업 flow, commit 규칙, branch 명 규칙, 디렉토리 구조, 기타 컨벤션
2. 코드 리뷰 담당 agent 생성