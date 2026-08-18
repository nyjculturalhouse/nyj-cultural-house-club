# 호스팅 방식 공식 근거 기록

현재 시스템은 React 클라이언트 외에 Express·tRPC, OAuth 관리자 인증, TiDB/MySQL 프로그램 데이터, S3 기반 사진 업로드, Google Apps Script 연동을 사용한다. 따라서 단순 정적 호스팅만으로 현재 기능 전체를 유지할 수는 없다.

Cloudflare Pages는 Git 공급자 연결로 배포할 수 있고 Pages Functions를 통해 전용 서버 없이 동적 코드를 배포할 수 있다. Cloudflare Workers는 Node.js 호환 계층을 제공하지만, 일부 API는 부분 지원 또는 호출 시 실패할 수 있는 polyfill이므로 현재 Express 서버와 `https.Agent` 사용 코드는 Workers 런타임에 맞게 재검토·이식해야 한다.

GitHub Pages는 저장소의 HTML·CSS·JavaScript를 발행하는 정적 호스팅 서비스다. 공식 제한 문서는 민감한 트랜잭션에 사용하면 안 된다고 명시한다. 따라서 관리자 비밀번호·OAuth·DB 저장·사진 업로드를 유지하려면 GitHub Pages 단독 배포는 맞지 않는다.

## 공식 출처

1. Cloudflare Workers Node.js compatibility: https://developers.cloudflare.com/workers/runtime-apis/nodejs/
2. Cloudflare Pages overview: https://developers.cloudflare.com/pages/
3. GitHub Pages overview: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
4. GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
