import { AssertParams, MethodLog } from '../dist';


class ClassA {

  @MethodLog({formater:(...args)=>{return ''},showEnd:true})
  @AssertParams(['abc',['name','string','tom'],['age','number',(value:any,params:any)=>{
    console.log(value,params);
    if (value==12){
      return 200
    }
    return 100
  }]],{
    // catcher:(err)=>{
    //   console.log(err.toString());
    //   // throw err;
    // }
  })
  test  (params: any)  {
    console.log(params);
  }
}

const test = () => {
  new ClassA().test({ abc: 1,age:11})
}
test()