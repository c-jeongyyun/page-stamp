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
3. 타입 작업. 네이밍 수정 및 내용의 성질(도메인/통신)에 맞게 파일 분리

## 260507

1. 피그마와 연속적인 경험을 제공하기 위해, figma의 디자인 시스템에 대한 내용이 포함된 DESIGN.md 파일 추가.

## 260509

1. pre-commit 설정 추가: develop에 자꾸 커밋하는 실수하여 이를 차단 & lint, test 실행하도록
2. sandbox 코드 - layered architecture로 구조 구체화. 구현 실행.
3. ui part plan 짜기 - 2번 이상 사용하는 컴포넌트 공통 컴포넌트화 하도록 변경, FE 테스팅 환경 구축

## 260510
