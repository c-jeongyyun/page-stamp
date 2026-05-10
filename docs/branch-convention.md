## Branch Naming Format

```
<type>/<issue-number>-<description>
<type>/<description>        (issue number 없을 때)
```

- 소문자 + 하이픈(-) 구분
- 공백, 대문자, 특수문자 금지

### Types

| 타입       | 용도                            |
| ---------- | ------------------------------- |
| `feature`  | 새 기능 개발                    |
| `bugfix`   | 일반 버그 수정                  |
| `hotfix`   | 프로덕션 긴급 수정              |
| `release`  | 배포 준비                       |
| `chore`    | 빌드, 의존성, 환경 세팅 등 잡무 |
| `refactor` | 리팩터링                        |
| `docs`     | 문서 작업                       |
| `test`     | 테스트 추가/수정                |
