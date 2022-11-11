# 기능 명세

## 1. 유저

- 유저 생성
- 유저 조회

## 2. 보스 레이드

- 보스레이드 상태 조회
- 보스레이드 시작
- 보스레이드 종료
- 랭킹 조회

# API 명세서

## 1. 유저 **user**

### 유저 생성

- API URL: **POST /user**
- Request body
```
{
}
```
- Response body
```
{
  userId: number
}
```
- 해당 유저 아이디만 반환

```
1. 중복되지 않는 userId를 생성
2. 생성된 userId를 응답
```
고려할 사항 - 0점 점수와 함께 유저 생성

### 유저 조회

- API URL: **GET /user/:userId**
- Request body
```
{
}
```
- Response body
```
{
  totalScore: number,
  bossRaidHistory: [
    { raidRecordId: number, score: number, enterTime: string, endTime: string }
    // ....
  ]
}
```
```
1. 해당 유저의 보스레이드 총 점수와 참여기록 응답
```

## 2. 보스레이드 **bossRaid**

### 보스레이드 상태 조회

- API URL: **GET /bossRaid**
- Request body
```
{
}
```
- Response body
```
{
  canEnter: boolean,
  enterdUserId: number,
}
```

```
1. 보스레이드 현재 상태 응답
  - canEnter: 입장 가능 여부
  - enteredUserId: 현재 진행중인 유저가 있다면, 해당 유저의 id
2. 입장 가능 조건: 한 번에 한 명의 유저만 보스레이드 진행
  - 아무도 보스레이드를 시작한 기록이 없다면 시작 가능.
  - 시작한 기록이 있다면 마지막으로 시작한 유저가 보스레이드를 종료했거나 시작한 시간으로부터 레이드 제한시간만큼 경과되었어야 함.
```

### 보스레이드 시작

- API URL: **POST /bossRaid/enter**
- Request body
```
{
  userId: number,
  level: number
}
```
- Response body
```
{
  isEntered: boolean,
  raidRecoredId: number,
}
```
```
1. 레이드 시작 가능하다면 중복되지 않는 raidRecordId를 생성하여 isEntered: true와 함께 응답
2. 레이드 시작이 불가하다면 isEntered: false
```

### 보스레이드 종료

- API URL: **PATCH /bossRaid/end**
- Request body
```
{
  userId: number,
  raidRecordId: number,
}
```
- Response body
```
{
}
```
```
1. raidRecoredId 종료 처리
  - 레이드 level에 따른 score 반영

2. 유효성 검사
  - 저장된 userId와 raidRecordId 일치하지 않다면 예외 처리
  - 시작한 시간으로부터 레이드 제한시간이 지났다면 예외처리
```

### 보스레이드 랭킹 조회

- API URL: **GET /bossRaid/topRankerList**
- Request body
```
{
  userId: number;
}
```
- Response body
```
{
  topRankerInfoList: RankingInfo[]
  myRankingInfo: RankingInfo
}
```
- interface
```ts
interface RankingInfo {
  ranking: number; // 랭킹 1위의 ranking 값은 0
  userId: number;
  totalScore: number;
}
```
```
1. 보스레이드 totalScore 내림차순으로 랭킹을 조회
```

# 고려 사항

- 랭킹 데이터는 웹 서버에 캐싱하거나 레디스에 캐싱

# Static Data 활용
`https://dmpilf5svl7rv.cloudfront.net/assignment/backend/bossRaidData.json`

= 보스레이드의 정적 데이터를 담고 있는 S3 오브젝트 주소
- API 비즈니스 로직 내부에서 위 S3 오브젝트의 응답값을 활용하여 코드 작성
```
{
  "bossRaids": [
    {
      "bossRaidLimitSeconds": 180,
      "levels": [
        {
          "level": 0,
          "score": 20
        },
        {
          "level": 1,
          "score": 47
        },
        {
          "level": 2,
          "score": 85
        } 
      ]
    } 
  ]
}
```

## 데이터

- bossRaidLimitSeconds: 제한시간
- levels: 레벨 별 레이드 처치 점수


# DB 설계

## 요청 • 응답 Body 프로퍼티 종합

- userId: number ✅
- totalScore: number ✅
```
bossRaidHistory: [
    { raidRecordId: number, score: number, enterTime: string, endTime: string }
```
- enterTime: string ✅
- endTime: string ✅
- canEnter: boolean
- enterdUserId: number
- isEntered: boolean
- raidRecoredId: number ✅
- level: number
- topRankerInfoList: RankingInfo[]
- myRankingInfo: RankingInfo
- ranking: number

## 1. 유저 테이블

- userId: 유저 고유 식별 ID
- createdAt: 생성 시간
- updatedAt: 수정 시간
- deletedAt: 삭제 시간

## 2. 보스레이드 테이블

- bossRaidId: 보스레이드 고유 식별 ID

## 3. 레이드기록 테이블

- raidRecordId: number
- score: number
- enterTime: string
- endTime: string

## 3. 캐싱할 항목

- { canEnter: boolean, enteredId: number }
- canEnter를 확인하여 isEnter를 조건적으로 반환
- RankingInfo

# 선택 구현

- 레디스를 사용하여 랭킹 기능 구현
- staticData 웹 서버 캐싱 고려
- NestJS 프레임워크 사용

# 평가 요소

- 요구한 기능이 잘 작동하는가
- 동시성을 고려하는가
- 레이어 계층을 잘 분리하는가(NestJS 사용)
- 발생할 수 있는 다양한 에러 상황을 잘 처리했는가