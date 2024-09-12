import { AssertParams, MethodLog } from '../dist';


class ClassA {

  @MethodLog({formater:(...args)=>{return ''},showEnd:true})
  @AssertParams(['abc',['name','string','tom'],['age','number']],{
    catcher:(err)=>{
      console.log(err.toString());
      throw err;
    }
  })
  test  (params: any)  {
    console.log(params);
  }
}

const test = () => {
  new ClassA().test({ abc: 1})
}
test()