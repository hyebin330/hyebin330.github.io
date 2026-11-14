# 국민대학교 경영정보학부 소개 사이트

정적 페이지와 Netlify Functions를 사용합니다. Netlify Blobs에 별명 방명록을 저장하고, 페이지에서 최신 50개를 표시합니다.

## 방명록 동작

- 방문자는 GitHub 계정 없이 별명과 메시지를 작성합니다.
- 입력은 서버에서 길이를 검사하고, IP별 요청 빈도를 제한합니다.
- 메시지는 공개 목록에 바로 표시됩니다. 이름과 내용은 HTML로 실행하지 않고 텍스트로 표시합니다.
- GitHub Pages에서 목록을 쓰려면 Netlify 함수 주소에 대한 공개 접근과 CORS가 필요합니다.

## Netlify 연결

1. Netlify 프로젝트의 Git 연속 배포에서 이 저장소의 `main` 브랜치를 연결합니다.
2. `netlify.toml` 설정대로 프로젝트 루트를 publish 디렉터리로 지정합니다.
3. 팀 SSO 보호를 해제해 공개 방문자가 페이지와 `/api/guestbook` 함수를 이용할 수 있게 합니다.
4. 첫 배포 뒤 `https://hyebin330-mis-guestbook.netlify.app/api/guestbook`에서 빈 목록 JSON이 반환되는지 확인합니다.

Netlify Blobs는 사이트 공용 저장소로 사용합니다. Deploy Preview와 프로덕션은 같은 방명록 데이터를 읽고 쓸 수 있으므로, Preview에서도 테스트 글을 제출하지 않습니다.
