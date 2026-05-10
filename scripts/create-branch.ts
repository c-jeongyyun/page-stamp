import { intro, group, select, text, cancel, spinner, outro, note } from '@clack/prompts';
import { execSync } from 'child_process';

const branchSpecs = [
  { value: 'feature', label: 'feature', hint: '새 기능 개발' },
  { value: 'bugfix', label: 'bugfix', hint: '일반 버그 수정' },
  { value: 'hotfix', label: 'hotfix', hint: '프로덕션 긴급 수정' },
  { value: 'release', label: 'release', hint: '배포 준비' },
  { value: 'chore', label: 'chore', hint: '빌드, 의존성, 환경 세팅 등 잡무' },
  { value: 'refactor', label: 'refactor', hint: '리팩터링' },
  { value: 'docs', label: 'docs', hint: '문서 작업' },
  { value: 'test', label: 'test', hint: '테스트 추가/수정' },
];

async function createBranch() {
  console.log(''); // 상단 여백
  intro('🌿 Git 브랜치 생성 도구');

  // 사용자 입력을 그룹으로 묶어 처리
  const project = await group(
    {
      type: () =>
        select({
          message: '생성할 브랜치 타입을 선택하세요',
          options: branchSpecs,
        }),
      description: () =>
        text({
          message: '브랜치 설명(description)을 입력하세요',
          placeholder: 'e.g. login-ui-fix',
          validate: (value) => {
            if (!value) return '설명은 필수입니다!';
            if (/\s/.test(value)) return '공백 없이 입력하거나 하이픈(-)을 사용해 주세요.';
          },
        }),
    },
    {
      // 사용자가 중간에 Cancel(Ctrl+C) 했을 때 처리
      onCancel: () => {
        cancel('브랜치 생성이 취소되었습니다.');
        process.exit(0);
      },
    },
  );

  const branchName = `${project.type}/${project.description.toLowerCase()}`;

  // 스피너를 이용한 시각적 효과
  const s = spinner();
  s.start(`브랜치 생성 중: ${branchName}`);

  try {
    // 실제 브랜치 생성 명령어 실행
    execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
    s.stop(`✅ 브랜치 생성 완료: ${branchName}`);

    outro('즐거운 코딩 되세요! 🚀');
  } catch (error: any) {
    s.stop('❌ 브랜치 생성 실패');
    note(error.message, '오류 내용');
    cancel('작업이 중단되었습니다.');
  }
}

createBranch();
